import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, StatusBar, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KnowledgeAgentCitation, askKnowledgeAgent } from '../../api/education';
import { Badge, Card } from '../../components';

interface AiEducatorBotScreenProps {
  onBack: () => void;
}

type ChatMessage =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'bot'; text: string; citations: KnowledgeAgentCitation[]; boundary: string }
  | { id: string; role: 'error'; text: string };

const INTRO_BOUNDARY =
  'Retrieval-backed education answer only. This is not legal advice, not funding approval, not individual NDIA decision interpretation, and not an official NDIA channel.';

const PRESET_QUESTIONS = [
  'What are NDIS goals?',
  'How do I prepare for my plan review?',
  'What does WHODAS mean?',
  'How should providers communicate with participants?',
];

function nextId() {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export function AiEducatorBotScreen({ onBack }: AiEducatorBotScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);

  async function handleAsk(question: string) {
    if (sending) return;

    setMessages((prev) => [...prev, { id: nextId(), role: 'user', text: question }]);
    setSending(true);

    try {
      const result = await askKnowledgeAgent(question);
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'bot', text: result.answer, citations: result.citations, boundary: result.boundary },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'error', text: err instanceof Error ? err.message : 'Could not reach the knowledge agent. Please try again.' },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function handleShareTranscript() {
    const transcript = messages
      .map((message) => {
        if (message.role === 'user') return `You: ${message.text}`;
        if (message.role === 'bot') return `S-TRAH AI: ${message.text}`;
        return `S-TRAH AI: ${message.text}`;
      })
      .join('\n\n');

    await Share.share({
      message: `GR8Care S-TRAH AI transcript\n\n${transcript}\n\n${INTRO_BOUNDARY}`,
    });
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3EE" />
      <ScrollView className="flex-1 bg-cream" contentContainerStyle={{ padding: 20, paddingBottom: 56 }}>
        <View className="w-full self-center" style={{ maxWidth: 390 }}>
          <View className="flex-row items-center gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={onBack}
              className="h-10 w-10 items-center justify-center rounded-md border border-border bg-white"
            >
              <Ionicons name="arrow-back" color="#1A1A2E" size={20} />
            </Pressable>
            <Text className="font-heading text-h1 text-text-dark">Ask S-TRAH AI</Text>
          </View>

          <Card variant="highlight" style={{ marginTop: 20 }}>
            <View className="flex-row items-start gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
                <Ionicons name="school" color="#0B4F6C" size={22} />
              </View>
              <View className="flex-1">
                <Text className="font-caption text-label uppercase text-teal-dark">Education knowledge agent</Text>
                <Text className="mt-1 font-body text-body text-text-mid">
                  Pick a question below. Answers are retrieved from the education library only, with citations shown.
                </Text>
              </View>
            </View>
          </Card>

          <Text className="font-body-medium text-caption text-text-dark" style={{ marginTop: 20 }}>
            Quick questions
          </Text>
          <View className="flex-row flex-wrap" style={{ marginTop: 10, gap: 8 }}>
            {PRESET_QUESTIONS.map((question) => (
              <Pressable
                key={question}
                accessibilityRole="button"
                disabled={sending}
                onPress={() => handleAsk(question)}
                className={`rounded-full border border-teal-mid bg-white px-4 py-2 ${sending ? 'opacity-50' : ''}`}
              >
                <Text className="font-body-medium text-caption text-teal-dark">{question}</Text>
              </Pressable>
            ))}
          </View>

          <View style={{ marginTop: 20, gap: 12 }}>
            {messages.length === 0 ? (
              <Card>
                <Text className="font-body text-caption text-text-mid text-center">
                  Tap a quick question above to start the conversation.
                </Text>
              </Card>
            ) : (
              messages.map((message) => {
                if (message.role === 'user') {
                  return (
                    <View key={message.id} className="items-end">
                      <View className="rounded-md bg-teal-dark px-4 py-3" style={{ maxWidth: '85%' }}>
                        <Text className="font-body-medium text-body text-cream">{message.text}</Text>
                      </View>
                    </View>
                  );
                }

                if (message.role === 'error') {
                  return (
                    <View key={message.id} className="items-start">
                      <View className="rounded-md border border-error bg-white px-4 py-3" style={{ maxWidth: '85%' }}>
                        <Text className="font-body text-caption text-error">{message.text}</Text>
                      </View>
                    </View>
                  );
                }

                return (
                  <View key={message.id} className="items-start" style={{ maxWidth: '100%' }}>
                    <View className="rounded-md border border-border bg-white px-4 py-3" style={{ maxWidth: '90%' }}>
                      <Text className="font-body text-body text-text-dark">{message.text}</Text>
                      {message.citations.length > 0 ? (
                        <View style={{ marginTop: 10, gap: 6 }}>
                          {message.citations.map((citation) => (
                            <View key={citation.id} className="flex-row flex-wrap items-center" style={{ gap: 6 }}>
                              <Badge label={citation.title} tone="info" />
                              <Text className="font-body text-caption text-text-light">{citation.category}</Text>
                            </View>
                          ))}
                        </View>
                      ) : null}
                      <Text className="font-body text-caption text-text-light" style={{ marginTop: 10 }}>
                        {message.boundary}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}

            {sending ? (
              <View className="items-start">
                <View className="flex-row items-center rounded-md border border-border bg-white px-4 py-3" style={{ gap: 8 }}>
                  <ActivityIndicator color="#0B4F6C" size="small" />
                  <Text className="font-body text-caption text-text-mid">S-TRAH AI is looking that up...</Text>
                </View>
              </View>
            ) : null}
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={messages.length === 0}
            onPress={handleShareTranscript}
            className={`flex-row items-center justify-center rounded-md border border-border bg-white ${messages.length === 0 ? 'opacity-50' : ''}`}
            style={{ marginTop: 20, height: 48, gap: 8 }}
          >
            <Ionicons name="share-outline" color="#1A1A2E" size={18} />
            <Text className="font-body-bold text-caption text-text-dark">Share transcript</Text>
          </Pressable>

          <View className="rounded-md border border-teal-light bg-cream" style={{ marginTop: 16, padding: 12 }}>
            <Text className="font-body text-caption text-text-mid">{INTRO_BOUNDARY}</Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
