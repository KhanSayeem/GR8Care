import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Badge, Button, Card } from '../../components';
import {
  educationCategories,
  educationChatbotLanguages,
  educationTopics,
  knowledgeAgentAnswer,
  templateExamples,
  whodasDomains,
} from '../../data/walkthroughData';
import { ScreenShell } from './ScreenShell';

export function EducationLibraryScreen() {
  const [activeCategory, setActiveCategory] = useState(educationCategories[0]);
  const [selectedArticle, setSelectedArticle] = useState(educationTopics[0]);
  const [selectedLanguageCode, setSelectedLanguageCode] = useState(educationChatbotLanguages[0].code);
  const [question, setQuestion] = useState(educationChatbotLanguages[0].question);
  const [answerVisible, setAnswerVisible] = useState(true);
  const [isReadAloud, setIsReadAloud] = useState(false);

  const visibleTopics = useMemo(
    () => educationTopics.filter((topic) => topic.category === activeCategory),
    [activeCategory],
  );

  const selectedLanguage = useMemo(
    () => educationChatbotLanguages.find((language) => language.code === selectedLanguageCode) ?? educationChatbotLanguages[0],
    [selectedLanguageCode],
  );

  const handleCategoryPress = (category: string) => {
    setActiveCategory(category);
    const firstTopic = educationTopics.find((topic) => topic.category === category);
    if (firstTopic) {
      setSelectedArticle(firstTopic);
    }
  };

  const handleLanguagePress = (language: (typeof educationChatbotLanguages)[number]) => {
    setSelectedLanguageCode(language.code);
    setQuestion(language.question);
    setAnswerVisible(false);
    setIsReadAloud(false);
  };

  const handleSearchPress = () => {
    setAnswerVisible(true);
    setIsReadAloud(false);
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
          Search education content only. This is not a live interpreter, clinical translation, legal advice, an official NDIA channel, funding approval, or an individual NDIA decision review.
        </Text>
        <View className="mt-4 gap-2">
          <Text className="font-body-medium text-caption text-text-dark">Simulated spoken language</Text>
          <View className="flex-row flex-wrap gap-2">
            {educationChatbotLanguages.map((language) => {
              const active = language.code === selectedLanguage.code;
              return (
                <Pressable
                  key={language.code}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Use ${language.label} spoken question`}
                  onPress={() => handleLanguagePress(language)}
                >
                  <Badge label={language.label} tone={active ? 'info' : 'neutral'} />
                </Pressable>
              );
            })}
          </View>
        </View>
        <Text className="mt-4 font-caption text-label uppercase text-text-mid">{selectedLanguage.promptLabel}</Text>
        <TextInput
          accessibilityLabel="Ask an education question"
          className="mt-4 rounded-md border border-teal-mid bg-white px-3 py-3 font-body text-body text-text-dark"
          multiline
          onChangeText={(value) => {
            setQuestion(value);
            setAnswerVisible(false);
            setIsReadAloud(false);
          }}
          placeholder="Ask an education-content question"
          placeholderTextColor="#A0AEC0"
          style={{ textAlign: selectedLanguage.textAlign, writingDirection: selectedLanguage.writingDirection }}
          value={question}
        />
        <View className="mt-3">
          <Button label={`Search in ${selectedLanguage.label}`} onPress={handleSearchPress} disabled={question.trim().length === 0} />
        </View>
        {answerVisible ? (
          <View className="mt-4 rounded-md border border-border bg-white p-3">
            <View className="flex-row flex-wrap items-start justify-between gap-2">
              <Text className="font-body-medium text-caption text-text-dark">Retrieved {selectedLanguage.label} answer</Text>
              <Badge label="Educational only" tone="info" />
            </View>
            <Text
              className="mt-2 font-body text-body text-text-mid"
              style={{ textAlign: selectedLanguage.textAlign, writingDirection: selectedLanguage.writingDirection }}
            >
              {selectedLanguage.answer}
            </Text>
            <View className="mt-3">
              <Button
                label={isReadAloud ? selectedLanguage.stopReadAloudLabel : selectedLanguage.readAloudLabel}
                variant="outline"
                onPress={() => setIsReadAloud((current) => !current)}
              />
            </View>
            {isReadAloud ? (
              <View className="mt-3 rounded-md border border-teal-light bg-cream p-3">
                <Text
                  className="font-body-medium text-caption text-teal-dark"
                  style={{ textAlign: selectedLanguage.textAlign, writingDirection: selectedLanguage.writingDirection }}
                >
                  {selectedLanguage.readAloudStatus}
                </Text>
              </View>
            ) : null}
            <Text className="mt-3 font-body text-caption text-text-mid">
              This chatbot does not replace a live interpreter, provide clinical translation, or act as an official NDIA communication channel.
            </Text>
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
            Education only. This is not legal advice, clinical translation, funding approval, individual NDIA decision interpretation, or an official NDIA communication channel.
          </Text>
        </View>
      </Card>

      <Card variant="highlight">
        <Text className="font-caption text-label uppercase text-teal-dark">Template library</Text>
        <Text className="mt-2 font-heading text-h2 text-text-dark">Educational examples</Text>
        <Text className="mt-2 font-body text-body text-text-mid">
          Example structures for support workers and providers. These are not audit documents, compliance documents, official records, or certification tools.
        </Text>
        <View className="mt-4 gap-3">
          {templateExamples.map((template) => (
            <View key={template.title} className="rounded-md border border-border bg-white p-3">
              <Text className="font-caption text-label uppercase text-coral">{template.category}</Text>
              <Text className="mt-1 font-body-medium text-caption text-text-dark">{template.title}</Text>
              <Text className="mt-1 font-body text-caption text-text-mid">{template.summary}</Text>
            </View>
          ))}
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
