import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { X, Send, Trash2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useNarciStore, type Message } from "@/lib/narciStore";
import { sendMessage, isRamadanNow, type NarciContext } from "@/lib/narci";
import { supabase } from "@/lib/supabase";
import { getRecentScans, getProductByBarcode } from "@/lib/products";
import { track, reportError } from "@/lib/analytics";
import { useAuthStore } from "@/lib/authStore";
import type { Product } from "@/types/database";

const SAMPLE_QUESTIONS = [
  "Ramazan'da ne yiyeyim?",
  "Tükettiğim şeker fazla mı?",
  "Kahvaltıda ne tavsiye edersin?",
  "Akşam atıştırmalık önerin?",
];

export default function NarciScreen() {
  const { productId, prompt: initialPrompt } = useLocalSearchParams<{
    productId?: string;
    prompt?: string;
  }>();

  const messages = useNarciStore((s) => s.messages);
  const addMessage = useNarciStore((s) => s.addMessage);
  const clearHistory = useNarciStore((s) => s.clearHistory);

  const user = useAuthStore((s) => s.user);
  const userName = (user?.user_metadata as any)?.name ?? null;

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [context, setContext] = useState<NarciContext>({
    profile: null,
    recentScans: [],
    currentProduct: null,
    isRamadan: isRamadanNow(),
  });
  const contextRef = useRef(context);
  contextRef.current = context;

  const listRef = useRef<FlatList<Message>>(null);
  const autoSentRef = useRef(false);
  const autoSendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (autoSendTimerRef.current) clearTimeout(autoSendTimerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  // Context'i yükle
  useEffect(() => {
    (async () => {
      if (!user) return;

      const [profileRes, recentScans] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        getRecentScans(10),
      ]);

      let currentProduct: Product | null = null;
      if (productId) {
        currentProduct = await getProductByBarcode(String(productId));
      }

      setContext({
        profile: profileRes.data ?? null,
        recentScans: recentScans.map((s) => ({
          name: s.product.name,
          score: s.score,
          brand: s.product.brand,
        })),
        currentProduct,
        isRamadan: isRamadanNow(),
      });

      // Hoşgeldin mesajı (ilk açılışta)
      if (messages.length === 0) {
        const greeting = userName
          ? `Selam ${userName}! Ben Narcı, senin beslenme koçunum. Taradığın ürünler hakkında konuşabilir, sana özel tavsiyeler verebilirim. Nasıl yardımcı olabilirim?`
          : "Selam! Ben Narcı, senin beslenme koçunum. Nasıl yardımcı olabilirim?";

        addMessage({ role: "assistant", content: greeting });
      }

      // Özel prompt varsa onu gönder, yoksa ürün bağlamıyla default soru
      if (messages.length === 0 && !autoSentRef.current) {
        autoSentRef.current = true;
        const payload = initialPrompt
          ? String(initialPrompt)
          : currentProduct
          ? `${currentProduct.name} hakkında konuşalım, dikkat edilmesi gerekenler neler?`
          : null;
        if (payload) {
          autoSendTimerRef.current = setTimeout(() => {
            if (mountedRef.current) handleSend(payload);
          }, 500);
        }
      }
    })();
  }, [user, productId]);

  const handleSend = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || sending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    addMessage({ role: "user", content: text });
    setInput("");
    setSending(true);
    track("narci_message_sent", {
      length: text.length,
      has_product_context: !!contextRef.current.currentProduct,
    });

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const history = useNarciStore.getState().messages;
      const reply = await sendMessage(
        history.map((m) => ({ role: m.role, content: m.content })),
        text,
        contextRef.current,
        controller.signal
      );
      if (!mountedRef.current) return;
      addMessage({ role: "assistant", content: reply });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      if (e?.name === "AbortError" || !mountedRef.current) return;
      reportError(e, { where: "narci.handleSend" });
      addMessage({
        role: "assistant",
        content: "Şu an cevap veremiyorum, biraz sonra tekrar dene.",
      });
    } finally {
      if (mountedRef.current) setSending(false);
    }
  };

  const handleClear = () => {
    Alert.alert("Geçmişi temizle", "Tüm sohbeti silmek istiyor musun?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: () => {
          clearHistory();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      },
    ]);
  };

  useEffect(() => {
    // Yeni mesaj gelince kaydırma
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages.length]);

  const showSampleQuestions = messages.filter((m) => m.role === "user").length === 0;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#FFF" }} edges={["top", "bottom"]}>
      {/* Top bar — sade: back, ortada başlık, sağda trash */}
      <View
        style={{
          paddingHorizontal: 12,
          paddingVertical: 10,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#FFF",
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <X size={22} color="#111" strokeWidth={2} />
        </Pressable>

        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ fontSize: 17, fontWeight: "700", color: "#111" }}>Narcı</Text>
        </View>

        <Pressable onPress={handleClear} hitSlop={10} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <Trash2 size={19} color="#999" strokeWidth={2} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item, index }) => (
            <MessageBubble
              message={item}
              showTime={shouldShowTime(messages, index)}
            />
          )}
          contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 16, flexGrow: 1 }}
          ListFooterComponent={
            <>
              {sending && <TypingIndicator />}
              {showSampleQuestions && messages.length > 0 && !sending && (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ fontSize: 12, color: "#999", marginBottom: 10, marginLeft: 2 }}>
                    Örnek sorular
                  </Text>
                  <View style={{ gap: 8 }}>
                    {SAMPLE_QUESTIONS.map((q) => (
                      <Pressable
                        key={q}
                        onPress={() => handleSend(q)}
                        style={{
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          borderRadius: 14,
                          backgroundColor: "#F4F4F5",
                        }}
                      >
                        <Text style={{ fontSize: 14, color: "#333" }}>{q}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </>
          }
        />

        {/* Input */}
        <View
          style={{
            paddingHorizontal: 12,
            paddingTop: 8,
            paddingBottom: 12,
            flexDirection: "row",
            alignItems: "flex-end",
            gap: 8,
            backgroundColor: "#FFF",
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Bir şey sor..."
            placeholderTextColor="#AAA"
            multiline
            maxLength={500}
            style={{
              flex: 1,
              maxHeight: 120,
              paddingHorizontal: 16,
              paddingTop: 11,
              paddingBottom: 11,
              borderRadius: 22,
              fontSize: 15,
              color: "#111",
              backgroundColor: "#F4F4F5",
            }}
          />
          <Pressable
            onPress={() => handleSend()}
            disabled={!input.trim() || sending}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: input.trim() && !sending ? "#C73030" : "#E5E5E7",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Send size={18} color="#FFF" strokeWidth={2.2} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function shouldShowTime(messages: Message[], index: number): boolean {
  if (index === 0) return true;
  const prev = messages[index - 1];
  const cur = messages[index];
  const diff = new Date(cur.timestamp).getTime() - new Date(prev.timestamp).getTime();
  return diff > 5 * 60 * 1000; // 5 dk
}

function MessageBubble({ message, showTime }: { message: Message; showTime: boolean }) {
  const isUser = message.role === "user";
  return (
    <View style={{ marginBottom: 4 }}>
      {showTime && (
        <Text
          style={{
            fontSize: 11,
            color: "#BBB",
            textAlign: "center",
            marginVertical: 8,
          }}
        >
          {formatTime(message.timestamp)}
        </Text>
      )}
      <View style={{ flexDirection: "row", justifyContent: isUser ? "flex-end" : "flex-start" }}>
        <View
          style={{
            maxWidth: "80%",
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 20,
            backgroundColor: isUser ? "#C73030" : "#F4F4F5",
          }}
        >
          <Text
            style={{
              fontSize: 15,
              lineHeight: 21,
              color: isUser ? "#FFF" : "#111",
            }}
          >
            {message.content}
          </Text>
        </View>
      </View>
    </View>
  );
}

function TypingIndicator() {
  return (
    <View style={{ flexDirection: "row", justifyContent: "flex-start", marginTop: 4, marginBottom: 4 }}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 20,
          backgroundColor: "#F4F4F5",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Dot delay={0} />
        <Dot delay={150} />
        <Dot delay={300} />
      </View>
    </View>
  );
}

function Dot({ delay }: { delay: number }) {
  const [opacity, setOpacity] = useState(0.3);
  useEffect(() => {
    const id = setInterval(() => {
      setOpacity((o) => (o < 0.9 ? 1 : 0.3));
    }, 500);
    const start = setTimeout(() => setOpacity(1), delay);
    return () => {
      clearInterval(id);
      clearTimeout(start);
    };
  }, [delay]);
  return (
    <View
      style={{
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#999",
        opacity,
        marginHorizontal: 2,
      }}
    />
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay ? `${h}:${m}` : `${d.getDate()}/${d.getMonth() + 1} ${h}:${m}`;
}
