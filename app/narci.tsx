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
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { X, Send, Trash2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useNarciStore, type Message } from "@/lib/narciStore";
import { sendMessage, isRamadanNow, type NarciContext } from "@/lib/narci";
import { supabase } from "@/lib/supabase";
import { getRecentScans, getProductByBarcode } from "@/lib/products";
import { useAuthStore } from "@/lib/authStore";
import type { Product } from "@/types/database";

const SAMPLE_QUESTIONS = [
  "Ramazan'da ne yiyeyim?",
  "T\u00fckettiğim şeker fazla m\u0131?",
  "Kahvalt\u0131da ne tavsiye edersin?",
  "Akşam at\u0131şt\u0131rmal\u0131k \u00f6nerin?",
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

  // Context'i y\u00fckle
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

      // Ho\u015fgeldin mesaj\u0131 (ilk a\u00e7\u0131l\u0131\u015fta)
      if (messages.length === 0) {
        const greeting = userName
          ? `Selam ${userName}! Ben Narc\u0131, senin beslenme ko\u00e7unum. Tarad\u0131\u011f\u0131n \u00fcr\u00fcnler hakk\u0131nda konu\u015fabilir, sana \u00f6zel tavsiyeler verebilirim. Nas\u0131l yard\u0131mc\u0131 olabilirim?`
          : "Selam! Ben Narc\u0131, senin beslenme ko\u00e7unum. Nas\u0131l yard\u0131mc\u0131 olabilirim?";

        addMessage({ role: "assistant", content: greeting });
      }

      // Özel prompt varsa onu gönder, yoksa ürün bağlamıyla default soru
      if (messages.length === 0) {
        if (initialPrompt) {
          setTimeout(() => handleSend(String(initialPrompt)), 500);
        } else if (currentProduct) {
          const autoMessage = `${currentProduct.name} hakk\u0131nda konu\u015fal\u0131m, dikkat edilmesi gerekenler neler?`;
          setTimeout(() => handleSend(autoMessage), 500);
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

    try {
      // G\u00fcncel ge\u00e7mi\u015fi al
      const history = useNarciStore.getState().messages;
      const reply = await sendMessage(
        history.map((m) => ({ role: m.role, content: m.content })),
        text,
        contextRef.current
      );
      addMessage({ role: "assistant", content: reply });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      addMessage({
        role: "assistant",
        content: e.message ?? "\u015eu an cevap veremiyorum, az sonra tekrar dene.",
      });
    } finally {
      setSending(false);
    }
  };

  const handleClear = () => {
    Alert.alert("Ge\u00e7mi\u015fi temizle", "T\u00fcm sohbeti silmek istiyor musun?", [
      { text: "Vazge\u00e7", style: "cancel" },
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
    // Yeni mesaj gelince kayd\u0131rma
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages.length]);

  const showSampleQuestions = messages.filter((m) => m.role === "user").length === 0;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#FFFDFB" }} edges={["top", "bottom"]}>
      {/* Top bar */}
      <View
        className="px-4 py-3 flex-row items-center border-b"
        style={{ borderColor: "#EEE", backgroundColor: "#FFF" }}
      >
        <Pressable onPress={() => router.back()} hitSlop={10} className="w-9 h-9 items-center justify-center">
          <X size={24} color="#111" strokeWidth={2} />
        </Pressable>

        <View className="flex-row items-center ml-2 flex-1">
          <View
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: "#C73030" }}
          >
            <Text
              style={{
                fontFamily: "PlayfairDisplay-BoldItalic",
                fontSize: 18,
                color: "#FFF",
              }}
            >
              N
            </Text>
          </View>
          <View className="ml-3">
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#111" }}>Narc\u0131</Text>
            <View className="flex-row items-center mt-0.5">
              <View
                className="w-1.5 h-1.5 rounded-full mr-1.5"
                style={{ backgroundColor: "#2D8A4E" }}
              />
              <Text style={{ fontSize: 11, color: "#666" }}>Aktif \u00b7 T\u00fcrk\u00e7e</Text>
            </View>
          </View>
        </View>

        <Pressable onPress={handleClear} hitSlop={10} className="w-9 h-9 items-center justify-center">
          <Trash2 size={20} color="#999" strokeWidth={2} />
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
          contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 12, flexGrow: 1 }}
          ListFooterComponent={
            <>
              {sending && <TypingIndicator />}
              {showSampleQuestions && messages.length > 0 && !sending && (
                <View className="mt-4 px-2">
                  <Text style={{ fontSize: 11, color: "#999", marginBottom: 8 }}>
                    \u00d6rnek sorular
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row" style={{ gap: 8 }}>
                      {SAMPLE_QUESTIONS.map((q) => (
                        <Pressable
                          key={q}
                          onPress={() => handleSend(q)}
                          className="rounded-full border px-3 py-2"
                          style={{ backgroundColor: "#FFF", borderColor: "#DDD" }}
                        >
                          <Text style={{ fontSize: 12, color: "#444" }}>{q}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}
            </>
          }
        />

        {/* Input */}
        <View
          className="px-3 pt-2 pb-3 border-t flex-row items-end"
          style={{ borderColor: "#EEE", backgroundColor: "#FFF", gap: 8 }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Bir \u015fey sor..."
            placeholderTextColor="#BBB"
            multiline
            maxLength={500}
            style={{
              flex: 1,
              maxHeight: 120,
              paddingHorizontal: 14,
              paddingTop: 10,
              paddingBottom: 10,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: "#EEE",
              fontSize: 15,
              color: "#111",
              backgroundColor: "#FAFAFA",
            }}
          />
          <Pressable
            onPress={() => handleSend()}
            disabled={!input.trim() || sending}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: input.trim() && !sending ? "#C73030" : "#DDD",
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
    <View className="mb-1">
      {showTime && (
        <Text
          style={{
            fontSize: 10,
            color: "#BBB",
            textAlign: "center",
            marginVertical: 6,
          }}
        >
          {formatTime(message.timestamp)}
        </Text>
      )}
      <View
        className={`flex-row ${isUser ? "justify-end" : "justify-start"}`}
      >
        <View
          style={{
            maxWidth: "82%",
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 18,
            borderBottomRightRadius: isUser ? 4 : 18,
            borderBottomLeftRadius: isUser ? 18 : 4,
            backgroundColor: isUser ? "#C73030" : "#FFF5F2",
          }}
        >
          <Text
            style={{
              fontSize: 14,
              lineHeight: 20,
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
    <View className="flex-row justify-start mt-1 mb-2">
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 18,
          borderBottomLeftRadius: 4,
          backgroundColor: "#FFF5F2",
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
        backgroundColor: "#C73030",
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
