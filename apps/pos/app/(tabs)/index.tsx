import React, { useState, useContext } from 'react'
import { View, SafeAreaView, StyleSheet, ScrollView, Alert } from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'

import { Input, Text, Button, Toggle } from '@team556/ui'
import { Colors } from '@/constants/Colors'
import { DrawerContext } from '../_layout'
import { StepFormContext } from '../_layout'

export default function HomeScreen() {
  const [input, setInput] = useState('')
  const [toggle1, setToggle1] = useState(false)
  const [toggle2, setToggle2] = useState(true)
  const [toggle3, setToggle3] = useState(false)
  const [demoName, setDemoName] = useState('')

  const { openDrawer, closeDrawer } = useContext(DrawerContext)
  const { openStepForm, closeStepForm } = useContext(StepFormContext)

  const handleOpenDrawer = () => {
    openDrawer(
      <View style={styles.drawerContent}>
        <Text preset='h2'>Drawer Content</Text>
        <Text preset='paragraph' style={styles.paragraph}>
          This is a custom bottom drawer that slides up from the bottom. You can add any content here. The drawer will
          automatically resize to fit its content.
        </Text>
        <Text preset='paragraph' style={styles.paragraph}>
          Pull down on the grab handle at the top or tap outside to dismiss.
        </Text>
        <View style={styles.listItem}>
          <MaterialIcons name='check-circle' size={24} color={Colors.tint} />
          <Text preset='paragraph' style={styles.listText}>
            Auto-sizing based on content
          </Text>
        </View>
        <View style={styles.listItem}>
          <MaterialIcons name='check-circle' size={24} color={Colors.tint} />
          <Text preset='paragraph' style={styles.listText}>
            Smooth animations and gestures
          </Text>
        </View>
        <View style={styles.listItem}>
          <MaterialIcons name='check-circle' size={24} color={Colors.tint} />
          <Text preset='paragraph' style={styles.listText}>
            Customizable appearance
          </Text>
        </View>
        <Button title='Close Drawer' onPress={closeDrawer} style={styles.closeButton} />
      </View>
    )
  }

  const handleOpenSmallDrawer = () => {
    openDrawer(
      <View style={styles.drawerContent}>
        <Text preset='h3'>Small Drawer</Text>
        <Text preset='paragraph' style={styles.paragraph}>
          This is a small drawer with minimal content.
        </Text>
        <Button title='Close' onPress={closeDrawer} style={styles.closeButton} />
      </View>
    )
  }

  const showDemoStepForm = () => {
    // Clear any previous name input
    setDemoName('')

    // Define simple demo steps
    const demoSteps = [
      {
        title: 'Step 1: Basic Information',
        content: (
          <View style={styles.stepContent}>
            <Text preset='paragraph'>This is a demonstration of the StepForm component used as an overlay.</Text>
            <Text preset='paragraph'>Notice how it renders above the tab navigation.</Text>
            <Input
              label='Name'
              placeholder='Enter your name'
              value={demoName}
              onChangeText={setDemoName}
              style={styles.formInput}
            />
          </View>
        )
      },
      {
        title: 'Step 2: Confirmation',
        content: (
          <View style={styles.stepContent}>
            <Text preset='h4' style={styles.summaryTitle}>
              StepForm Demo
            </Text>
            <Text preset='paragraph'>
              This component can be used for multi-step processes like onboarding, registration flows, checkout
              processes, and more.
            </Text>
            <Text preset='paragraph' style={styles.confirmText}>
              Press "Finish" to close this demo.
            </Text>
          </View>
        )
      }
    ]

    // Open the step form
    openStepForm(demoSteps, {
      initialStep: 0,
      completeButtonText: 'Finish',
      onComplete: () => {
        // Close the form first to prevent the alert from being hidden behind it
        closeStepForm()
        // Show completion alert with a slight delay to ensure form is closed
        setTimeout(() => {
          Alert.alert('Demo Completed', 'You have completed the StepForm demo.')
        }, 300)
      }
    })
  }

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <ScrollView style={{ padding: 14, marginBottom: 50 }}>
          <View style={styles.container}>
            <Text preset='h2' style={styles.heading}>
              Inputs
            </Text>
            <Input
              label='Search'
              placeholder='Enter text...'
              leftIcon={<MaterialIcons name='search' size={24} color={Colors.text} />}
              rightIcon={<MaterialIcons name='close' size={24} color={Colors.text} />}
              onRightIconPress={() => setInput('')}
              error={input.length === 0 ? 'This is an error' : ''}
              value={input}
              onChangeText={setInput}
              style={styles.inputBase}
            />
          </View>

          <View style={styles.container}>
            <Text preset='h2' style={styles.heading}>
              Toggles
            </Text>
            <Toggle value={toggle1} onValueChange={setToggle1} />
            <Toggle label='Basic toggle' value={toggle1} onValueChange={setToggle1} />
            <Toggle label='Active toggle' value={toggle2} onValueChange={setToggle2} size='large' />
            <Toggle
              label='Custom colors'
              value={toggle3}
              onValueChange={setToggle3}
              activeColor='#4caf50'
              inactiveColor='rgba(255, 0, 0, 0.3)'
              labelPosition='left'
            />
            <Toggle label='Disabled toggle' value={true} onValueChange={() => {}} disabled />
          </View>

          <View style={styles.container}>
            <Text preset='h2' style={styles.heading}>
              Buttons
            </Text>
            <View style={styles.buttonRow}>
              <Button title='Primary' variant='primary' />
              <Button title='Secondary' variant='secondary' />
            </View>
            <View style={styles.buttonRow}>
              <Button title='With Icon' leftIcon={<MaterialIcons name='add' size={20} color='#fff' />} />
              <Button title='Outline' variant='outline' />
            </View>
            <View style={styles.buttonRow}>
              <Button title='Danger' variant='danger' />
              <Button title='Loading' loading />
            </View>
            <Button title='Full Width' fullWidth style={styles.fullWidthButton} />
            <Button variant='ghost' title='Ghost Button' style={styles.fullWidthButton} />
          </View>

          <View style={styles.container}>
            <Text preset='h2' style={styles.heading}>
              Text
            </Text>
            <Text preset='h1'>Heading 1</Text>
            <Text preset='h2'>Heading 2</Text>
            <Text preset='h3'>Heading 3</Text>
            <Text preset='h4'>Heading 4</Text>
            <Text preset='paragraph'>Paragraph</Text>
            <Text preset='label'>Label</Text>
            <Text preset='caption'>Caption</Text>
          </View>

          <View style={styles.container}>
            <Text preset='h2' style={styles.heading}>
              Drawer Demo
            </Text>
            <View style={styles.buttonRow}>
              <Button title='Standard Drawer' onPress={handleOpenDrawer} style={styles.button} />
              <Button title='Small Drawer' onPress={handleOpenSmallDrawer} style={styles.button} />
            </View>
          </View>

          <View style={styles.container}>
            <Text preset='h2' style={styles.heading}>
              Step Form
            </Text>
            <View style={styles.buttonRow}>
              <Button title='Quick Demo' onPress={showDemoStepForm} style={styles.button} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  fullWidthButton: {
    marginTop: 8
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 14,
    color: Colors.tint,
    textDecorationLine: 'underline'
  },
  inputBase: {
    height: 50,
    backgroundColor: Colors.backgroundDark,
    borderWidth: 0,
    color: Colors.text,
    paddingHorizontal: 16,
    borderRadius: 8
  },
  button: {
    marginTop: 20,
    flex: 1,
    marginHorizontal: 5
  },
  drawerContent: {
    alignItems: 'flex-start'
  },
  closeButton: {
    marginTop: 20,
    width: '100%'
  },
  paragraph: {
    marginBottom: 12,
    lineHeight: 22
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6
  },
  listText: {
    marginLeft: 12
  },
  stepContent: {
    flex: 1,
    width: '100%'
  },
  formInput: {
    marginTop: 20
  },
  summaryTitle: {
    marginBottom: 16
  },
  confirmText: {
    marginTop: 24,
    opacity: 0.7
  }
})
