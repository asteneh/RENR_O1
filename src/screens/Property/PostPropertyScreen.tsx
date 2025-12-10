import React, { useState } from 'react';
import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, 
  ScrollView, Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const THEME_COLOR = '#FF8C00';
const STEPS = ['Basic', 'Location', 'Details', 'Media'];

export default function PostPropertyScreen({ navigation }: any) {
  const [currentStep, setCurrentStep] = useState(0);

  // --- Components ---

  const Stepper = () => (
    <View style={styles.stepperContainer}>
      {STEPS.map((step, index) => {
        const isActive = index <= currentStep;
        return (
          <View key={index} style={styles.stepWrapper}>
            <View style={[styles.stepCircle, isActive && styles.activeStepCircle]}>
              {isActive ? (
                <Ionicons name="checkmark" size={14} color="#fff" />
              ) : (
                <Text style={styles.stepNumber}>{index + 1}</Text>
              )}
            </View>
            <Text style={[styles.stepLabel, isActive && styles.activeStepLabel]}>{step}</Text>
            {/* Line connector */}
            {index < STEPS.length - 1 && <View style={styles.stepLine} />}
          </View>
        );
      })}
    </View>
  );

  const BasicForm = () => (
    <View>
      <View style={styles.inputGroup}>
        <Ionicons name="text" size={20} color={THEME_COLOR} style={styles.inputIcon} />
        <TextInput placeholder="Property Title" style={styles.input} />
      </View>
      <Text style={styles.charCount}>0/70</Text>

      <View style={[styles.inputGroup, { alignItems: 'flex-start', height: 120 }]}>
        <Ionicons name="document-text-outline" size={20} color={THEME_COLOR} style={styles.inputIcon} />
        <TextInput placeholder="Description" multiline style={[styles.input, { height: '100%' }]} />
      </View>
      <Text style={styles.charCount}>0/1000</Text>

      <View style={styles.pickerBox}>
        <Text style={styles.pickerText}>Property Category</Text>
        <Ionicons name="caret-down" size={16} color="#666" />
      </View>

      <View style={styles.pickerBox}>
        <Text style={styles.pickerText}>Listing Type</Text>
        <Ionicons name="caret-down" size={16} color="#666" />
      </View>
    </View>
  );

  const LocationForm = () => (
    <View>
      <View style={styles.pickerBox}>
        <View>
            <Text style={styles.labelSmall}>City</Text>
            <Text style={styles.pickerValue}>Addis Ababa</Text>
        </View>
        <Ionicons name="caret-down" size={16} color="#666" />
      </View>

      <View style={styles.pickerBox}>
         <View>
            <Text style={styles.labelSmall}>Sub-City / Location</Text>
            <Text style={styles.pickerValue}>Bole</Text>
        </View>
        <Ionicons name="caret-down" size={16} color="#666" />
      </View>

      <View style={[styles.inputGroup, styles.errorBorder]}>
        <Ionicons name="location-outline" size={20} color={THEME_COLOR} style={styles.inputIcon} />
        <TextInput placeholder="Street Name" value="XR3M+HP6" style={styles.input} />
        <View style={styles.errorDot} />
      </View>
      <View style={{flexDirection:'row', justifyContent:'space-between'}}>
         <Text style={{color:'red', fontSize:12, marginTop:4}}>Street is required</Text>
         <Text style={styles.charCount}>8/100</Text>
      </View>

      <TouchableOpacity style={styles.mapBtn}>
        <Ionicons name="map-outline" size={20} color={THEME_COLOR} />
        <Text style={styles.mapBtnText}>Pick from Google Map</Text>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={styles.coordBox}>
            <Text style={styles.coordLabel}>Latitude</Text>
            <View style={{flexDirection:'row', alignItems:'center', marginTop:5}}>
                <Ionicons name="locate" size={20} color={THEME_COLOR} />
                <Text style={{marginLeft:10}}>8.954955</Text>
            </View>
        </View>
        <View style={styles.coordBox}>
            <Text style={styles.coordLabel}>Longitude</Text>
            <View style={{flexDirection:'row', alignItems:'center', marginTop:5}}>
                <Ionicons name="locate" size={20} color={THEME_COLOR} />
                <Text style={{marginLeft:10}}>38.833704</Text>
            </View>
        </View>
      </View>
    </View>
  );

  const MediaForm = () => (
    <View>
      <Text style={styles.sectionHeader}>Property Images (Max 10)</Text>
      <Text style={styles.sectionSubHeader}>The first image you add will be the primary one.</Text>
      
      <TouchableOpacity style={styles.imageUploadBox}>
        <Ionicons name="camera-outline" size={32} color={THEME_COLOR} />
        <Text style={styles.uploadText}>Add Image</Text>
        <Text style={styles.uploadText}>0/10</Text>
      </TouchableOpacity>
      <Text style={{color:'salmon', fontSize:12, marginTop:5}}>Please add at least one image.</Text>

      <Text style={[styles.sectionHeader, {marginTop: 20}]}>Features</Text>
      <View style={styles.tagsContainer}>
        {['2 Stories', "26' Ceilings", 'Bike Path', 'Central Cooling', 'Central Heating', 'Dual Sinks'].map(tag => (
            <View key={tag} style={styles.tagBadge}>
                <Text style={styles.tagText}>{tag}</Text>
            </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header handled by Stack Navigator, but we can customize Title there */}
      
      {/* Stepper */}
      <View style={styles.stepperWrapper}>
        <Stepper />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {currentStep === 0 && <BasicForm />}
        {currentStep === 1 && <LocationForm />}
        {currentStep === 2 && <View><Text>Details Form (Simulated)</Text></View>} 
        {currentStep === 3 && <MediaForm />}

        {/* Navigation Buttons */}
        <View style={styles.footerBtns}>
          <TouchableOpacity 
            style={styles.nextBtn}
            onPress={() => {
                if(currentStep < 3) setCurrentStep(currentStep + 1);
                else alert("Property Posted!");
            }}
          >
            <Text style={styles.nextBtnText}>{currentStep === 3 ? "Finish" : "Next"}</Text>
          </TouchableOpacity>

          {currentStep > 0 && (
              <TouchableOpacity onPress={() => setCurrentStep(currentStep - 1)} style={styles.backBtn}>
                  <Text style={styles.backBtnText}>back</Text>
              </TouchableOpacity>
          )}
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  stepperWrapper: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  stepperContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  stepWrapper: { flexDirection: 'row', alignItems: 'center' },
  stepCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center', marginRight: 5 },
  activeStepCircle: { backgroundColor: THEME_COLOR },
  stepNumber: { fontSize: 12, color: '#fff' },
  stepLabel: { fontSize: 14, color: '#aaa', marginRight: 10 },
  activeStepLabel: { color: '#333', fontWeight: 'bold' },
  stepLine: { width: 20, height: 2, backgroundColor: '#eee', marginRight: 10 },

  content: { padding: 20 },
  inputGroup: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', borderRadius: 8,
    paddingHorizontal: 15, paddingVertical: 12, marginTop: 15
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16 },
  charCount: { alignSelf: 'flex-end', fontSize: 12, color: '#999', marginTop: 4 },

  pickerBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#f9f9f9', borderRadius: 8, padding: 15, marginTop: 15,
    borderWidth: 1, borderColor: '#eee'
  },
  pickerText: { fontSize: 16, color: '#666' },
  pickerValue: { fontSize: 16, color: '#000', fontWeight: '500' },
  labelSmall: { fontSize: 12, color: '#999', marginBottom: 2 },

  // Location Specific
  errorBorder: { borderColor: 'salmon', borderWidth: 1 },
  errorDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME_COLOR },
  mapBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: THEME_COLOR, borderRadius: 8, padding: 15, marginVertical: 20
  },
  mapBtnText: { color: THEME_COLOR, fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
  coordBox: { width: '48%', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 10 },
  coordLabel: { position: 'absolute', top: -10, left: 10, backgroundColor: '#fff', paddingHorizontal: 5, fontSize: 12, color: '#666' },

  // Media Specific
  sectionHeader: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  sectionSubHeader: { fontSize: 13, color: '#666', marginBottom: 15 },
  imageUploadBox: { 
    width: 100, height: 100, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', 
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' 
  },
  uploadText: { fontSize: 12, color: '#666', marginTop: 4 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  tagBadge: { 
    borderWidth: 1, borderColor: '#333', borderRadius: 8, 
    paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, marginBottom: 8 
  },
  tagText: { fontSize: 14 },

  // Buttons
  footerBtns: { flexDirection: 'row', alignItems: 'center', marginTop: 30 },
  nextBtn: { backgroundColor: THEME_COLOR, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 20, marginRight: 20 },
  nextBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  backBtn: { },
  backBtnText: { color: THEME_COLOR, fontSize: 16 },
});