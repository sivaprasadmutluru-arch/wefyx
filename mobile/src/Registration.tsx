import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiSend } from './api';

export default function Registration({ role, onBack, onRegistered }: { role: 'CUSTOMER' | 'VENDOR' | 'EMPLOYEE'; onBack: () => void; onRegistered: (email: string) => void }) {
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const input = { backgroundColor: '#EEF3F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#073B2E', fontSize: 14, marginTop: 12 };
  const normalizePhone = () => {
    const clean = phone.trim().replace(/[\s()-]/g, '');
    return clean.startsWith('+') ? clean : `+971${clean.replace(/^0/, '')}`;
  };

  async function submit() {
    setError('');
    if (!name.trim() || !organization.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter your name, company and a valid email.');
      return;
    }
    const fullPhone = otpStep ? verifiedPhone : normalizePhone();
    if (!/^\+9715[024568][0-9]{7}$/.test(fullPhone)) {
      setError('Enter a valid UAE mobile number, for example +971501234567.');
      return;
    }
    if (password.length < 8 || password.length > 72) {
      setError('Use a password between 8 and 72 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!consent) {
      setError('Please acknowledge the privacy policy.');
      return;
    }
    setBusy(true);
    try {
      if (!otpStep) {
        const sent = await apiSend<{ phone: string; message: string }>('/auth/send-otp', 'POST', { phone: fullPhone, purpose: 'registration' });
        setVerifiedPhone(sent.phone);
        setOtp('');
        setOtpStep(true);
        return;
      }
      if (!/^[0-9]{6}$/.test(otp)) {
        setError('Enter the 6-digit OTP sent to your mobile.');
        return;
      }
      await apiSend('/auth/register', 'POST', { name: name.trim(), organization: organization.trim(), email: email.trim(), phone: verifiedPhone, password, role, otp });
      setPassword('');
      setConfirm('');
      setOtp('');
      Alert.alert(role === 'CUSTOMER' ? 'Account created' : 'Approval required', role === 'CUSTOMER' ? 'You can now sign in with your new account.' : 'Your registration has been submitted. An administrator must approve your account before you can sign in.', [{ text: 'Back to sign in', onPress: () => onRegistered(email.trim()) }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create account.');
    } finally {
      setBusy(false);
    }
  }

  return <SafeAreaView style={{ flex: 1, backgroundColor: '#008553' }}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, paddingBottom: 40 }}><Pressable onPress={otpStep ? () => setOtpStep(false) : onBack}><Text style={{ color: 'white', fontSize: 14 }}>‹ {otpStep ? 'Edit details' : 'Back to sign in'}</Text></Pressable><Text style={{ color: 'white', fontSize: 28, fontWeight: '700', marginTop: 28 }}>Create {role === 'VENDOR' ? 'vendor' : role === 'EMPLOYEE' ? 'employee' : 'customer'} account</Text><Text style={{ color: '#B8E7CF', marginTop: 8 }}>{otpStep ? `Enter the OTP sent to ${verifiedPhone}` : 'Join Wefyx with your own business account.'}</Text><View style={{ backgroundColor: 'white', borderRadius: 24, padding: 20, marginTop: 24 }}>{otpStep ? <TextInput style={input} value={otp} onChangeText={value => setOtp(value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit OTP" placeholderTextColor="#60756B" selectionColor="#008553" keyboardType="number-pad" maxLength={6} /> : <><TextInput style={input} value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor="#60756B" selectionColor="#008553" maxLength={120} /><TextInput style={input} value={organization} onChangeText={setOrganization} placeholder="Company / organization" placeholderTextColor="#60756B" selectionColor="#008553" maxLength={200} /><TextInput style={input} value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor="#60756B" selectionColor="#008553" autoCapitalize="none" keyboardType="email-address" autoComplete="email" maxLength={254} /><TextInput style={input} value={phone} onChangeText={setPhone} placeholder="Mobile number (+971501234567)" placeholderTextColor="#60756B" selectionColor="#008553" keyboardType="phone-pad" autoComplete="tel" maxLength={25} /><TextInput style={input} value={password} onChangeText={setPassword} placeholder="Password (minimum 8 characters)" placeholderTextColor="#60756B" selectionColor="#008553" secureTextEntry autoComplete="new-password" /><TextInput style={input} value={confirm} onChangeText={setConfirm} placeholder="Confirm password" placeholderTextColor="#60756B" selectionColor="#008553" secureTextEntry autoComplete="new-password" /><Pressable onPress={() => setConsent(value => !value)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20 }}><Text style={{ color: '#008553', fontSize: 22, marginRight: 10 }}>{consent ? '☑' : '☐'}</Text><Text style={{ flex: 1, color: '#63796C', fontSize: 12 }}>I have read and acknowledge the privacy policy.</Text></Pressable><Pressable onPress={() => Linking.openURL('https://wefyx.pro/privacy-policy')}><Text style={{ color: '#008553', fontSize: 12, marginTop: 8 }}>View privacy policy</Text></Pressable></>}{!!error && <Text style={{ color: '#DC2626', marginTop: 16, fontSize: 13 }}>{error}</Text>}<Pressable disabled={busy} onPress={submit} style={{ backgroundColor: '#008553', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 22 }}>{busy ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: '600' }}>{otpStep ? 'Verify OTP & create account' : 'Send OTP'}</Text>}</Pressable></View></ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
