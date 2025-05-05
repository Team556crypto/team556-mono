import React from 'react';
import { View, StyleSheet, Platform, Dimensions, Pressable } from 'react-native';
import { Text } from '@repo/ui';
import { Feather } from '@expo/vector-icons'; // Import Feather
import { Colors } from '@/constants/Colors';

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  rating: number;
}

const TestimonialsSection: React.FC = () => {
  // Testimonials data
  const testimonials: Testimonial[] = [
    {
      quote:
        'Team556 has revolutionized how I manage my collection. The integration with Solana blockchain gives me peace of mind about my data security.',
      author: 'John D.',
      role: 'Firearms Enthusiast',
      rating: 5
    },
    {
      quote:
        "I've tried several firearm management apps, but none compare to the security and feature set of Team556. The ammunition tracking alone is worth it.",
      author: 'Michael T.',
      role: 'Competitive Shooter',
      rating: 5
    },
    {
      quote:
        'Keeping track of my NFA items used to be a nightmare. Now with Team556, I get notifications about important dates and can store all my documentation securely.',
      author: 'Sarah L.',
      role: 'Collector',
      rating: 5
    }
  ];

  const renderStars = (rating: number, starColor: string) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Feather 
        key={index}
        name="star"
        size={16}
        color={index < rating ? starColor : Colors.textSecondary} // Use Colors.textSecondary
        style={index < rating ? styles.filledStar : styles.emptyStar} // Apply fill effect
      />
    ));
  };

  return (
    <View style={styles.container} id="testimonials">
      <View style={styles.contentContainer}>
        {/* Section Header */}
        <View style={styles.headerContainer}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>User Stories</Text>
          </View>
          <Text style={styles.heading}>What Our Users Say</Text>
          <Text style={styles.subheading}>
            Hear from firearms enthusiasts who trust Team556 for their management needs
          </Text>
        </View>

        {/* Testimonials Grid */}
        <View style={styles.testimonialsGrid}>
          {testimonials.map((testimonial, index) => (
            <Pressable
              key={index}
              style={({ pressed }) => [
                styles.testimonialCard,
                pressed && styles.testimonialCardPressed
              ]}
            >
              <View style={styles.ratingContainer}>
                {renderStars(testimonial.rating, Colors.secondary || '#14F195')} 
              </View>

              <Text style={styles.quoteText}>"{testimonial.quote}"</Text>

              <View style={styles.authorContainer}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>{testimonial.author.charAt(0)}</Text>
                </View>
                <View style={styles.authorInfo}>
                  <Text style={styles.authorName}>{testimonial.author}</Text>
                  <Text style={styles.authorRole}>{testimonial.role}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 60,
  },
  contentContainer: {
    paddingHorizontal: 16,
    maxWidth: 1280,
    width: '100%',
    marginHorizontal: 'auto',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
    maxWidth: 640,
    marginHorizontal: 'auto',
  },
  badge: {
    backgroundColor: `${Colors.secondary}33`, // 20% opacity
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${Colors.secondary}66`, // 40% opacity
    marginBottom: 16,
  },
  badgeText: {
    color: Colors.secondary || '#14F195',
    fontSize: 14,
    fontWeight: '600',
  },
  heading: {
    fontSize: isTablet ? 40 : 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
    ...(Platform.OS === 'web' ? {
      background: 'linear-gradient(90deg, #14F195, #7affc6)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    } : {
      color: Colors.secondary || '#14F195',
    }),
  },
  subheading: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
  },
  testimonialsGrid: {
    flexDirection: isTablet ? 'row' : 'column',
    flexWrap: 'wrap',
    gap: 24,
  },
  testimonialCard: {
    flex: isTablet ? 1 : undefined,
    minWidth: isTablet ? '30%' : '100%',
    backgroundColor: 'rgba(20, 20, 30, 0.4)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    transform: [{ translateY: 0 }],
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(12px)',
      transition: 'all 0.3s ease-in-out',
    } : {}),
  },
  testimonialCardPressed: {
    backgroundColor: 'rgba(30, 30, 40, 0.5)',
    borderColor: `${Colors.secondary}4D`, // 30% opacity
    transform: [{ translateY: -8 }],
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filledStar: {
    // No specific style needed if just changing color
  },
  emptyStar: {
    opacity: 0.5 // Make empty stars slightly faded
  },
  quoteText: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.text,
    fontStyle: 'italic',
    marginBottom: 24,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.secondary}33`, // 20% opacity
    borderWidth: 1,
    borderColor: `${Colors.secondary}66`, // 40% opacity
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  authorRole: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default TestimonialsSection;
