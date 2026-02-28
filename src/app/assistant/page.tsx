"use client"

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, User, Sparkles, Loader2 } from "lucide-react";
import { aiTripFAQAssistant } from "@/ai/flows/ai-trip-faq-assistant-flow";

interface Message {
  role: 'user' | 'ai';
  content: string;
}

export default function AssistantPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "أهلاً بك! أنا المساعد الذكي للعوجان للسفر. كيف يمكنني مساعدتك اليوم بخصوص رحلتك أو طردك؟" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await aiTripFAQAssistant({ question: userMessage });
      setMessages(prev => [...prev, { role: 'ai', content: response.answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "عذراً، أواجه مشكلة في الاتصال حالياً. يرجى المحاولة لاحقاً." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-4">
      <header className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">مساعد السفر الذكي</h1>
          <p className="text-xs text-muted-foreground">مدعوم بالذكاء الاصطناعي</p>
        </div>
      </header>

      <Card className="flex-1 flex flex-col overflow-hidden border-primary/10 shadow-lg">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-tl-none'
                      : 'bg-muted text-foreground rounded-tr-none border'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-end">
                <div className="bg-muted p-3 rounded-2xl rounded-tr-none border">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <CardContent className="p-4 border-t bg-white">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              placeholder="اسأل عن المسارات، الحقائب، أو السياسات..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
              <Send className="h-4 w-4 rotate-180" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-[10px] h-auto py-2"
          onClick={() => setInput("ما هو وزن الأمتعة المسموح به؟")}
        >
          وزن الأمتعة؟
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-[10px] h-auto py-2"
          onClick={() => setInput("كيف يمكنني إلغاء حجزي؟")}
        >
          سياسة الإلغاء؟
        </Button>
      </div>
    </div>
  );
}
