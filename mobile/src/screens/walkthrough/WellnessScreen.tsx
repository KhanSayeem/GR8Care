import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Badge, Button, Card } from '../../components';
import { wellnessItems } from '../../data/walkthroughData';
import { ScreenShell } from './ScreenShell';

export function WellnessScreen() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [reviewReady, setReviewReady] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCaptureToggle = () => {
    setSubmitted(false);
    setCopied(false);
    if (isCapturing) {
      setIsCapturing(false);
      setReviewReady(true);
      return;
    }

    setIsCapturing(true);
    setReviewReady(false);
  };

  const handleSubmit = () => {
    if (!reviewReady) {
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
          <Text className="mt-2 font-body text-body text-text-mid">
            Participant attended the appointment, practised travel planning, and requested a reminder card for the next visit.
          </Text>
        </View>

        <View className="mt-3 rounded-md border border-teal-light bg-white p-3">
          <Text className="font-body-medium text-caption text-text-dark">Drafting aid only</Text>
          <Text className="mt-1 font-body text-caption text-text-mid">
            This is educational support only. It is not certified, audited, or automatically submitted documentation.
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
            <Button label="Submit draft" variant="outline" disabled={!reviewReady} onPress={handleSubmit} />
          </View>
        </View>

        <View className="mt-4 gap-2">
          <Text className="font-body-medium text-caption text-text-dark">Structured note preview</Text>
          <Text className="font-body text-body text-text-mid">What happened: appointment attended and travel planning practised.</Text>
          <Text className="font-body text-body text-text-mid">Participant response: asked for a reminder card for the next visit.</Text>
          <Text className="font-body text-body text-text-mid">Follow-up action: prepare reminder card before the next support session.</Text>
        </View>

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
              <Text className="font-body text-body text-text-mid">Shift summary: appointment attended and travel planning practised.</Text>
              <Text className="font-body text-body text-text-mid">Participant response: requested a reminder card for the next visit.</Text>
              <Text className="font-body text-body text-text-mid">Next action: prepare the reminder card before the next support session.</Text>
            </View>

            <View className="mt-3">
              <Button label={copied ? 'Copied for review' : 'Copy structured note'} variant="primary" onPress={handleCopy} />
            </View>

            <Text className="mt-2 font-body text-caption text-text-mid">
              Copying does not save, certify, audit, or submit this note. Follow provider policy before using it.
            </Text>
          </View>
        ) : null}
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
