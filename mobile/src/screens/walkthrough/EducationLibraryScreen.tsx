import React, { useMemo, useState } from 'react';
import { Pressable, StatusBar, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card } from '../../components';
import {
  educationCategories,
  educationCategoryGuides,
  educationChatbotLanguages,
  educationTopics,
  knowledgeAgentAnswer,
  templateExamples,
  whodasDomains,
} from '../../data/walkthroughData';
import { ScreenShell } from './ScreenShell';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export function EducationLibraryScreen() {
  const [activeCategory, setActiveCategory] = useState(educationCategories[0]);
  const [selectedArticle, setSelectedArticle] = useState(educationTopics[0]);
  const [selectedLanguageCode, setSelectedLanguageCode] = useState(educationChatbotLanguages[0].code);
  const [knowledgeQuestion, setKnowledgeQuestion] = useState(knowledgeAgentAnswer.question);
  const [knowledgeAnswerVisible, setKnowledgeAnswerVisible] = useState(true);
  const [question, setQuestion] = useState(educationChatbotLanguages[0].question);
  const [answerVisible, setAnswerVisible] = useState(true);
  const [isReadAloud, setIsReadAloud] = useState(false);

  const visibleTopics = useMemo(
    () => educationTopics.filter((topic) => topic.category === activeCategory),
    [activeCategory],
  );

  const selectedCategoryGuide = useMemo(
    () => educationCategoryGuides.find((category) => category.name === activeCategory) ?? educationCategoryGuides[0],
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

  const handleKnowledgeSearchPress = () => {
    setKnowledgeAnswerVisible(true);
  };

  return (
    <ScreenShell
      eyebrow="Learning"
      title="NDIS education library"
      subtitle="Plain-language education grouped for participants, support workers, and providers."
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3EE" />
      <Card variant="highlight">
        <View className="flex-row items-start gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
            <Ionicons name="school" color="#0B4F6C" size={22} />
          </View>
          <View className="flex-1">
            <Text className="font-caption text-label uppercase text-teal-dark">Educational framing</Text>
            <Text className="mt-1 font-heading text-h2 text-text-dark">Learn before planning, support, or provider conversations</Text>
            <Text className="mt-2 font-body text-body text-text-mid">
              The library explains NDIS concepts in everyday language. It does not replace official NDIA channels, qualified professional advice, provider policy, or a participant's own decision-making supports.
            </Text>
          </View>
        </View>
      </Card>

      <View className="gap-3">
        <Text className="font-body-medium text-caption text-text-dark">Browse categories</Text>
        <View className="gap-3">
          {educationCategoryGuides.map((category) => {
            const active = category.name === activeCategory;
            const topicCount = educationTopics.filter((topic) => topic.category === category.name).length;

            return (
              <Pressable
                key={category.name}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Open ${category.name}`}
                onPress={() => handleCategoryPress(category.name)}
              >
                <Card className={active ? 'border-teal-dark bg-teal-light' : 'bg-white'}>
                  <View className="flex-row items-start gap-3">
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-cream">
                      <Ionicons name={category.icon as IoniconName} color={active ? '#0B4F6C' : '#4A5568'} size={22} />
                    </View>
                    <View className="flex-1 gap-2">
                      <Text className="font-heading text-h2 text-text-dark">{category.name}</Text>
                      <View className="flex-row flex-wrap items-center gap-2">
                        <Badge label={category.audience} tone={active ? 'info' : 'neutral'} />
                        <Text className="font-body text-caption text-text-mid">{topicCount} guide</Text>
                      </View>
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Card>
        <View className="flex-row flex-wrap items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="font-caption text-label uppercase text-coral">{selectedCategoryGuide.audience}</Text>
            <Text className="mt-1 font-heading text-h2 text-text-dark">{selectedCategoryGuide.name}</Text>
            <Text className="mt-2 font-body text-body text-text-mid">{selectedCategoryGuide.framing}</Text>
          </View>
          <Badge label={selectedCategoryGuide.quickAccess} tone="info" />
        </View>

        <View className="mt-4 gap-3">
          {visibleTopics.map((topic) => {
            const active = topic.title === selectedArticle.title;

            return (
              <Pressable
                key={topic.title}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setSelectedArticle(topic)}
              >
                <View className={`rounded-md border p-3 ${active ? 'border-teal-mid bg-teal-light' : 'border-border bg-white'}`}>
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <Text className="font-body-medium text-caption text-text-dark">{topic.title}</Text>
                      <Text className="mt-1 font-body text-caption text-text-mid">{topic.summary}</Text>
                    </View>
                    <Badge label={topic.readTime} tone={active ? 'info' : 'neutral'} />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Card>

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
        <Text className="font-caption text-label uppercase text-teal-dark">Knowledge Agent</Text>
        <Text className="mt-2 font-heading text-h2 text-text-dark">Ask the NDIS library</Text>
        <Text className="mt-2 font-body text-body text-text-mid">
          Search education content only with retrieved-answer framing and visible citations.
        </Text>
        <Text className="mt-4 font-caption text-label uppercase text-text-mid">Education-content question</Text>
        <TextInput
          accessibilityLabel="Ask the NDIS Knowledge Agent"
          className="mt-4 rounded-md border border-teal-mid bg-white px-3 py-3 font-body text-body text-text-dark"
          multiline
          onChangeText={(value) => {
            setKnowledgeQuestion(value);
            setKnowledgeAnswerVisible(false);
          }}
          placeholder="Ask a question about education library content"
          placeholderTextColor="#A0AEC0"
          value={knowledgeQuestion}
        />
        <View className="mt-3">
          <Button label="Search education content" onPress={handleKnowledgeSearchPress} disabled={knowledgeQuestion.trim().length === 0} />
        </View>
        {knowledgeAnswerVisible ? (
          <View className="mt-4 rounded-md border border-border bg-white p-3">
            <View className="flex-row flex-wrap items-start justify-between gap-2">
              <View className="flex-1">
                <Text className="font-body-medium text-caption text-text-dark">Retrieved answer</Text>
                <Text className="mt-1 font-body text-caption text-text-mid">{knowledgeAgentAnswer.mode}</Text>
              </View>
              <Badge label="Educational only" tone="info" />
            </View>
            <Text className="mt-3 font-body text-body text-text-mid">{knowledgeAgentAnswer.answer}</Text>
            <Text className="mt-3 font-caption text-label uppercase text-text-mid">Citations</Text>
            <View className="mt-2 gap-2">
              {knowledgeAgentAnswer.citations.map((citation) => (
                <View key={citation.title} className="rounded-md border border-teal-light bg-cream p-3">
                  <View className="flex-row flex-wrap items-start justify-between gap-2">
                    <Text className="flex-1 font-body-medium text-caption text-text-dark">{citation.title}</Text>
                    <Badge label={citation.score} tone="neutral" />
                  </View>
                  <Text className="mt-1 font-body text-caption text-text-mid">{citation.category}</Text>
                  <Text className="mt-1 font-body text-caption text-text-mid">{citation.sourceReference}</Text>
                </View>
              ))}
            </View>
            <View className="mt-3 rounded-md border border-teal-light bg-cream p-3">
              <Text className="font-body text-caption text-text-mid">
                Educational only. This is not NDIA advice, legal advice, clinical advice, funding approval, an individual NDIA decision review, or an official NDIA communication channel.
              </Text>
            </View>
          </View>
        ) : null}
      </Card>

      <Card>
        <Text className="font-caption text-label uppercase text-coral">Education chatbot</Text>
        <Text className="mt-2 font-heading text-h2 text-text-dark">Language practice answer</Text>
        <Text className="mt-2 font-body text-body text-text-mid">
          Simulated spoken-language support for education copy. This is separate from the retrieval Knowledge Agent.
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
