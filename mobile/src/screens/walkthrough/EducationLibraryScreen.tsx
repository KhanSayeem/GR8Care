import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Badge, Button, Card } from '../../components';
import { educationCategories, educationTopics, knowledgeAgentAnswer, whodasDomains } from '../../data/walkthroughData';
import { ScreenShell } from './ScreenShell';

export function EducationLibraryScreen() {
  const [activeCategory, setActiveCategory] = useState(educationCategories[0]);
  const [selectedArticle, setSelectedArticle] = useState(educationTopics[0]);
  const [question, setQuestion] = useState(knowledgeAgentAnswer.question);
  const [answerVisible, setAnswerVisible] = useState(true);

  const visibleTopics = useMemo(
    () => educationTopics.filter((topic) => topic.category === activeCategory),
    [activeCategory],
  );

  const handleCategoryPress = (category: string) => {
    setActiveCategory(category);
    const firstTopic = educationTopics.find((topic) => topic.category === category);
    if (firstTopic) {
      setSelectedArticle(firstTopic);
    }
  };

  return (
    <ScreenShell
      eyebrow="Learning"
      title="NDIS education library"
      subtitle="Plain-language articles grouped around planning, assessment, and support coordination."
    >
      <Card variant="highlight">
        <Text className="font-caption text-label uppercase text-teal-dark">Knowledge Agent</Text>
        <Text className="mt-2 font-heading text-h2 text-text-dark">Ask the NDIS library</Text>
        <Text className="mt-2 font-body text-body text-text-mid">
          Search education content only. Answers are retrieved from library topics, not official NDIA, legal, clinical, or funding decisions.
        </Text>
        <TextInput
          accessibilityLabel="Ask an education question"
          className="mt-4 rounded-md border border-teal-mid bg-white px-3 py-3 font-body text-body text-text-dark"
          multiline
          onChangeText={(value) => {
            setQuestion(value);
            setAnswerVisible(false);
          }}
          placeholder="Ask an education-content question"
          placeholderTextColor="#A0AEC0"
          value={question}
        />
        <View className="mt-3">
          <Button label="Search education content" onPress={() => setAnswerVisible(true)} disabled={question.trim().length === 0} />
        </View>
        {answerVisible ? (
          <View className="mt-4 rounded-md border border-border bg-white p-3">
            <View className="flex-row flex-wrap items-start justify-between gap-2">
              <Text className="font-body-medium text-caption text-text-dark">Retrieved answer</Text>
              <Badge label="Educational only" tone="info" />
            </View>
            <Text className="mt-2 font-body text-body text-text-mid">{knowledgeAgentAnswer.answer}</Text>
            <Text className="mt-3 font-caption text-label uppercase text-text-mid">Retrieved from</Text>
            <Text className="mt-1 font-body text-caption text-text-mid">{knowledgeAgentAnswer.sources.join(' + ')}</Text>
          </View>
        ) : null}
      </Card>

      <View className="gap-3">
        <Text className="font-body-medium text-caption text-text-dark">Browse categories</Text>
        <View className="flex-row flex-wrap gap-2">
          {educationCategories.map((category) => {
            const active = category === activeCategory;
            return (
              <Pressable key={category} accessibilityRole="button" onPress={() => handleCategoryPress(category)}>
                <Badge label={category} tone={active ? 'info' : 'neutral'} />
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="gap-3">
        {visibleTopics.map((topic) => (
          <Pressable key={topic.title} accessibilityRole="button" onPress={() => setSelectedArticle(topic)}>
            <Card>
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="font-caption text-label uppercase text-coral">{topic.category}</Text>
                  <Text className="mt-1 font-heading text-h2 text-text-dark">{topic.title}</Text>
                  <Text className="mt-2 font-body text-body text-text-mid">{topic.summary}</Text>
                </View>
                <Badge label={topic.readTime} tone="info" />
              </View>
            </Card>
          </Pressable>
        ))}
      </View>

      <Card>
        <View className="flex-row flex-wrap items-start justify-between gap-2">
          <View className="flex-1">
            <Text className="font-caption text-label uppercase text-coral">{selectedArticle.category}</Text>
            <Text className="mt-1 font-heading text-h2 text-text-dark">{selectedArticle.title}</Text>
          </View>
          <Badge label={selectedArticle.readTime} tone="info" />
        </View>
        <Text className="mt-3 font-body text-body text-text-mid">{selectedArticle.detail}</Text>
        <Text className="mt-3 font-body-medium text-caption text-text-dark">Language path</Text>
        <Text className="mt-1 font-body text-caption text-text-mid">{selectedArticle.language}</Text>
        <View className="mt-3 rounded-md border border-teal-light bg-cream p-3">
          <Text className="font-body text-caption text-text-mid">
            Education only. This is not legal advice, funding approval, or an official NDIA communication channel.
          </Text>
        </View>
      </Card>

      <Card variant="warning">
        <Text className="font-caption text-label uppercase text-warning">WHODAS education</Text>
        <Text className="mt-2 font-heading text-h2 text-text-dark">Six daily-functioning domains</Text>
        <Text className="mt-2 font-body text-body text-text-mid">
          Plain-language explanation only. This is not a clinical assessment, diagnosis, or official scoring system.
        </Text>
        <View className="mt-4 gap-3">
          {whodasDomains.map((domain) => (
            <View key={domain.title} className="rounded-md border border-border bg-white p-3">
              <Text className="font-body-medium text-caption text-text-dark">{domain.title}</Text>
              <Text className="mt-1 font-body text-caption text-text-mid">{domain.body}</Text>
            </View>
          ))}
        </View>
      </Card>
    </ScreenShell>
  );
}
