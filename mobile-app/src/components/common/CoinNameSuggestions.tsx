// src/components/common/CoinNameSuggestions.tsx
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Typography, Spacing, GlassmorphismStyles } from '../../styles';

interface CoinNameSuggestionsProps {
  query: string;
  onSuggestionSelect: (suggestion: CoinSuggestion) => void;
  visible: boolean;
}

interface CoinSuggestion {
  name: string;
  description: string;
  pcgsSupported: boolean;
  examples: string[];
}

const COIN_SUGGESTIONS: CoinSuggestion[] = [
  {
    name: 'Morgan Dollar',
    description: 'Silver dollars minted 1878-1921',
    pcgsSupported: true,
    examples: ['1921', '1921-S', '1921-D', '1885-O', '1904-O']
  },
  {
    name: 'Peace Dollar',
    description: 'Silver dollars minted 1921-1935',
    pcgsSupported: true,
    examples: ['1922', '1923', '1924', '1925', '1926']
  },
  {
    name: 'American Women Quarter',
    description: '2022-2025 commemorative quarters',
    pcgsSupported: true,
    examples: ['Sally Ride', 'Maya Angelou', 'Wilma Mankiller', 'Nina Otero-Warren']
  },
  {
    name: 'Walking Liberty Half',
    description: 'Half dollars minted 1916-1947',
    pcgsSupported: true,
    examples: ['1943', '1942', '1944', '1941', '1945']
  },
  {
    name: 'Mercury Dime',
    description: 'Winged Liberty dimes 1916-1945',
    pcgsSupported: true,
    examples: ['1943', '1942', '1944', '1941', '1945']
  },
  {
    name: 'Kennedy Half Dollar',
    description: 'Half dollars minted 1964-present',
    pcgsSupported: true,
    examples: ['1964', '1965', '1966', '1967', '1968']
  },
  {
    name: 'Washington Quarter',
    description: 'Quarters minted 1932-present',
    pcgsSupported: true,
    examples: ['1932', '1964', '1965', '1976 Bicentennial']
  },
  {
    name: 'State Quarter',
    description: '1999-2008 state commemoratives',
    pcgsSupported: true,
    examples: ['Delaware', 'Pennsylvania', 'New Jersey', 'Georgia', 'Connecticut']
  },
  {
    name: 'American Eagle Silver',
    description: 'Silver bullion coins 1986-present',
    pcgsSupported: true,
    examples: ['2022', '2021', '2020', '2019', '2018']
  },
  {
    name: 'Buffalo Nickel',
    description: 'Indian Head nickels 1913-1938',
    pcgsSupported: true,
    examples: ['1937', '1936', '1935', '1934', '1938']
  }
];

export const CoinNameSuggestions = ({ query, onSuggestionSelect, visible }: CoinNameSuggestionsProps) => {
  const filteredSuggestions = useMemo(() => {
    if (!query || query.length < 2) return [];
    
    const searchTerms = query.toLowerCase().split(' ');
    
    return COIN_SUGGESTIONS.filter(suggestion => {
      const nameWords = suggestion.name.toLowerCase().split(' ');
      const descriptionWords = suggestion.description.toLowerCase().split(' ');
      const allWords = [...nameWords, ...descriptionWords];
      
      return searchTerms.some(term => 
        allWords.some(word => word.includes(term))
      );
    }).slice(0, 5); // Limit to 5 suggestions
  }, [query]);

  if (!visible || filteredSuggestions.length === 0) {
    return null;
  }

  return (
    <BlurView intensity={80} style={styles.suggestionsContainer}>
      <Text style={styles.suggestionsTitle}>💡 PCGS-Supported Suggestions:</Text>
      <ScrollView style={styles.suggestionsList} nestedScrollEnabled>
        {filteredSuggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={styles.suggestionItem}
            onPress={() => onSuggestionSelect(suggestion)}
          >
            <View style={styles.suggestionHeader}>
              <Text style={styles.suggestionName}>{suggestion.name}</Text>
              {suggestion.pcgsSupported && (
                <View style={styles.pcgsBadge}>
                  <Text style={styles.pcgsBadgeText}>PCGS</Text>
                </View>
              )}
            </View>
            <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
            <Text style={styles.suggestionExamples}>
              Examples: {suggestion.examples.slice(0, 3).join(', ')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  suggestionsContainer: {
    ...GlassmorphismStyles.card,
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    maxHeight: 300,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: Colors.primary.gold,
  },
  suggestionsTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  suggestionsList: {
    maxHeight: 250,
  },
  suggestionItem: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.cardBorder,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  suggestionName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    flex: 1,
  },
  pcgsBadge: {
    backgroundColor: Colors.primary.gold,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pcgsBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: '#000',
  },
  suggestionDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  suggestionExamples: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
  },
});

export default CoinNameSuggestions;