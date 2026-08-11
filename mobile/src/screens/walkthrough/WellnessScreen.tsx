import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Badge, Button, Card } from '../../components';
import { calmingAudioItem, wellnessItems } from '../../data/walkthroughData';
import { ScreenShell } from './ScreenShell';

export function WellnessScreen() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [reviewReady, setReviewReady] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [reviewedTranscript, setReviewedTranscript] = useState(
    'Participant attended the appointment, practised travel planning, and requested a reminder card for the next visit.',
  );

  const hasReviewedTranscript = reviewedTranscript.trim().length > 0;
  const structuredNoteLines = useMemo(
    () => [
      'Shift summary: appointment attended and travel planning practised.',
      'Participant response: requested a reminder card for the next visit.',
      'Next action: prepare the reminder card before the next support session.',
      `Worker reviewed transcript: ${reviewedTranscript.trim() || 'No worker-provided summary entered.'}`,
    ],
    [reviewedTranscript],
  );
  const handleCaptureToggle = () => {
    setSubmitted(false);
    setCopied(false);
    if (isCapturing) {
      setIsCapturing(false);
      setReviewReady(hasReviewedTranscript);
      return;
    }

    setIsCapturing(true);
    setReviewReady(false);
  };

  const handleSubmit = () => {
    if (!reviewReady || !hasReviewedTranscript) {
      return;
    }

    setSubmitted(true);
    setCopied(false);
  };

  const handleCopy = () => {
    setCopied(true);
  };

  return (
    <ScreenShell
      eyebrow="Support Worker"
      title="Wellness and shift notes"
      subtitle="Short prompts that help workers reset, document clearly, and keep escalation boundaries visible."
    >
      <Card variant="highlight">
        <Text className="font-caption text-label uppercase text-teal-dark">Welcome back</Text>
        <Text className="mt-2 font-heading text-h2 text-text-dark">Thank you for supporting participants today</Text>
        <Text className="mt-2 font-body text-body text-text-mid">
          Use this MVP screen for a simple reset, worker-owned shift note drafting, and clear escalation boundaries.
        </Text>
      </Card>

      <Card variant="warning">
        <View className="flex-row flex-wrap items-start justify-between gap-2">
          <View className="flex-1">
            <Text className="font-caption text-label uppercase text-warning">Shift Note AI</Text>
            <Text className="mt-2 font-heading text-h2 text-text-dark">Voice capture draft</Text>
          </View>
          <Badge label={isCapturing ? 'Recording' : reviewReady ? 'Review' : 'Ready'} tone={isCapturing ? 'error' : 'warning'} />
        </View>

        <Text className="mt-2 font-body text-body text-text-mid">
          Capture a worker-spoken shift summary, review the transcript, then send only the reviewed worker text into the drafting flow.
        </Text>

        <View className="mt-4 rounded-md border border-border bg-cream p-3">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="font-body-medium text-caption text-text-dark">Worker-provided transcript</Text>
            <Text className="font-caption text-label uppercase text-text-mid">{isCapturing ? 'Listening' : 'Editable review'}</Text>
          </View>
          <TextInput
            accessibilityLabel="Review worker-provided shift transcript"
            className="mt-3 min-h-28 rounded-md border border-teal-light bg-white px-3 py-3 font-body text-body text-text-dark"
            multiline
            onChangeText={(value) => {
              setReviewedTranscript(value);
              setSubmitted(false);
              setCopied(false);
              setReviewReady(value.trim().length > 0 && !isCapturing);
            }}
            placeholder="Review the worker-spoken summary before generating a draft"
            placeholderTextColor="#A0AEC0"
            value={reviewedTranscript}
          />
        </View>

        <View className="mt-3 rounded-md border border-teal-light bg-white p-3">
          <Text className="font-body-medium text-caption text-text-dark">Drafting aid only</Text>
          <Text className="mt-1 font-body text-caption text-text-mid">
            This is educational support only. It must not invent activities, fabricate records, claim certification, or automatically submit documentation.
          </Text>
        </View>

        <View className="mt-4 flex-row gap-3">
          <View className="flex-1">
            <Button
              label={isCapturing ? 'Stop and review' : 'Start capture'}
              variant={isCapturing ? 'secondary' : 'primary'}
              onPress={handleCaptureToggle}
            />
          </View>
          <View className="flex-1">
            <Button label="Submit draft" variant="outline" disabled={!reviewReady || !hasReviewedTranscript} onPress={handleSubmit} />
          </View>
        </View>

        {reviewReady ? (
          <View className="mt-4 rounded-md border border-border bg-white p-3">
            <Text className="font-body-medium text-caption text-text-dark">Ready for worker review submission</Text>
            <Text className="mt-1 font-body text-caption text-text-mid">
              The drafting flow will use only the reviewed worker-provided transcript above.
            </Text>
          </View>
        ) : null}

        {submitted ? (
          <View className="mt-4 rounded-md border border-teal-mid bg-teal-light p-3">
            <View className="flex-row flex-wrap items-start justify-between gap-2">
              <View className="flex-1">
                <Text className="font-body-medium text-caption text-teal-dark">Generated structured note</Text>
                <Text className="mt-1 font-body text-caption text-text-mid">
                  Review this draft before pasting it into your organisation's own system.
                </Text>
              </View>
              <Badge label="Worker review" tone="info" />
            </View>

            <View className="mt-3 gap-2 rounded-md bg-white p-3">
              {structuredNoteLines.map((line) => (
                <Text key={line} className="font-body text-body text-text-mid">
                  {line}
                </Text>
              ))}
            </View>

            <View className="mt-3">
              <Button label={copied ? 'Copied for review' : 'Copy structured note'} variant="primary" onPress={handleCopy} />
            </View>

            <Text className="mt-2 font-body text-caption text-text-mid">
              Copying does not save, certify, audit, or submit this note. Follow provider policy and confirm every activity came from worker review before using it.
            </Text>
          </View>
        ) : null}
      </Card>

      <Card variant="highlight">
        <View className="flex-row flex-wrap items-start justify-between gap-2">
          <View className="flex-1">
            <Text className="font-caption text-label uppercase text-teal-dark">Optional reset</Text>
            <Text className="mt-2 font-heading text-h2 text-text-dark">{calmingAudioItem.title}</Text>
          </View>
          <Badge label={audioPlaying ? 'Playing' : calmingAudioItem.duration} tone={audioPlaying ? 'success' : 'info'} />
        </View>

        <Text className="mt-2 font-body text-body text-text-mid">{calmingAudioItem.body}</Text>

        <View className="mt-4">
          <Button
            label={audioPlaying ? 'Pause audio' : 'Play audio'}
            variant={audioPlaying ? 'secondary' : 'primary'}
            onPress={() => setAudioPlaying((playing) => !playing)}
          />
        </View>

        <View className="mt-3 rounded-md border border-border bg-white p-3">
          <Text className="font-body-medium text-caption text-text-dark">
            {audioPlaying ? 'Audio is playing' : 'Audio is paused'}
          </Text>
          <Text className="mt-1 font-body text-caption text-text-mid">{calmingAudioItem.boundary}</Text>
        </View>
      </Card>

      <View className="gap-3">
        {wellnessItems.map((item) => (
          <Pressable key={item.title} accessibilityRole="button">
            <Card>
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="font-heading text-h3 text-text-dark">{item.title}</Text>
                  <Text className="mt-1 font-body text-body text-text-mid">{item.body}</Text>
                </View>
                <Badge label={item.tag} tone="info" />
              </View>
            </Card>
          </Pressable>
        ))}
      </View>
    </ScreenShell>
  );
}
