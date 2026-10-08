import './global.css';
import Registration from './src/Registration';
import WebServices, {openWebsite} from './src/WebServices';
import {CartScreen, CatalogScreen, OrdersScreen} from './src/Commerce';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  LogBox,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary, type Asset as ImageAsset } from 'react-native-image-picker';
import DeviceInfo from 'react-native-device-info';
import { NavigationContainer, useNavigation, useFocusEffect } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import {
  ArrowLeft,
  Bell,
  Box,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  CircleHelp,
  Clock3,
  Eye,
  EyeOff,
  FileText,
  Headphones,
  Home,
  KeyRound,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Package,
  Plus,
  Phone,
  Search,
  ShieldCheck,
  ShoppingCart,
  Ticket as TicketIcon,
  Wifi,
  Wrench,
} from 'lucide-react-native';
import {
  ApiError,
  apiGet,
  apiLogin,
  apiRequestLoginOtp,
  apiSend,
  apiUpload,
  apiVerifyPhoneLogin,
  clearSessionToken,
  getSessionToken,
  saveSessionToken,
  setUnauthorizedHandler,
} from './src/api';
import {
  checkLocationPermission,
  openLocationSettings,
  requestLocationPermission,
  requestNotificationPermission,
  type LocationPermissionState,
} from './src/locationPermission';

LogBox.ignoreAllLogs(true);

type Ticket = {
  id: number;
  reference: string;
  subject: string;
  customer: string;
  assignee: string;
  priority: string;
  status: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
  quotationRequested?: boolean;
  estimatedAmount?: number;
  quotationStatus?: string;
  vendorName?: string;
  agreedAmount?: number;
  selectedQuotationId?: number;
};
type VendorQuotation = { id:number; vendorName:string; amount:number; leadTimeDays:number; notes?:string; status:string };
const requirementToTicket = (r:any):Ticket => ({...r,subject:r.title,customer:r.customerName,assignee:r.employeeName || 'Wefyx Support',description:r.description});
type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  organization: string;
  location: string;
  status: string;
  joinedOn: string;
  lastLogin?: string;
};
type ResourceRecord = {
  id: number;
  moduleKey: string;
  name: string;
  owner: string;
  details: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};
type RootStack = {
  Main: undefined;
  TicketDetails: { ticket: Ticket };
  BookSupport: undefined;
  WebServices: undefined;
  TrackTechnician: { ticket?: Ticket } | undefined;
  ContractDetails: undefined;
  Notifications: undefined;
  Help: undefined;
  Cart: undefined;
  Orders: undefined;
};
const Stack = createNativeStackNavigator<RootStack>(),
  Tabs = createBottomTabNavigator(),
  purple = '#008553',
  muted = '#7C8498';

function WefyxLoader({
  size = 54,
  light = false,
}: {
  size?: number;
  light?: boolean;
}) {
  const rotation = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [rotation]);
  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: light ? 'transparent' : '#FFFFFF',
        shadowColor: purple,
        shadowOpacity: light ? 0 : 0.18,
        shadowRadius: 10,
        elevation: light ? 0 : 5,
      }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 3,
          borderColor: light ? 'rgba(255,255,255,0.35)' : '#B8E7CF',
          borderTopColor: light ? '#FFFFFF' : purple,
          transform: [{ rotate: spin }],
        }}
      />
      <Text
        style={{
          fontFamily: 'Poppins-ExtraBold',
          fontSize: size * 0.46,
          letterSpacing: -2,
          color: light ? '#FFFFFF' : '#073B2E',
        }}
      >
        W
      </Text>
    </View>
  );
}
const statusColor: Record<string, string> = {
  OPEN: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-violet-100 text-violet-700',
  PENDING: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-slate-200 text-slate-600',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  AVAILABLE: 'bg-emerald-100 text-emerald-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  RENTED: 'bg-blue-100 text-blue-700',
  MAINTENANCE: 'bg-amber-100 text-amber-700',
  REPAIR: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-red-100 text-red-700',
  NOT_SET: 'bg-slate-100 text-slate-600',
};

function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="mb-5 flex-row items-center justify-between">
      <View>
        <Text className="text-2xl font-black text-ink">{title}</Text>
        {subtitle && (
          <Text className="mt-1 text-xs text-slate-500">{subtitle}</Text>
        )}
      </View>
      <Pressable className="relative h-11 w-11 items-center justify-center rounded-full bg-white">
        <Bell size={20} color={purple} />
        <View className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
      </Pressable>
    </View>
  );
}
function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View
      className={`rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ${className}`}
    >
      {children}
    </View>
  );
}
function Badge({ value }: { value: string }) {
  return (
    <Text
      className={`rounded-full px-2 py-1 text-[10px] font-bold ${
        statusColor[value] || 'bg-slate-100 text-slate-600'
      }`}
    >
      {value.replace('_', ' ')}
    </Text>
  );
}

function CenteredPageLoader() {
  return (
    <View className="absolute inset-0 z-50 items-center justify-center bg-white/80" style={{ paddingTop: 72 }}>
      <WefyxLoader size={62} />
      <Text className="mt-4 font-medium text-xs text-slate-500">Loading your workspace</Text>
    </View>
  );
}

function TabHero({ title, subtitle, icon: Icon, right }: { title: string; subtitle: string; icon?: any; right?: React.ReactNode }) {
  return (
    <View className="border-b border-border bg-white px-5 pb-4 pt-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-4">
          <Text className="text-lg font-bold text-textPrimary">{title}</Text>
          <Text className="mt-1 text-xs leading-5 text-textSecondary">{subtitle}</Text>
        </View>
        {right || (Icon && (
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-inputBg">
            <Icon size={20} color="#008553" />
          </View>
        ))}
      </View>
    </View>
  );
}

function BrandMark() {
  return (
    <View className="h-20 w-20 items-center justify-center rounded-[24px] bg-white shadow-lg">
      <Text style={{fontFamily:'Poppins-ExtraBold',fontSize:42,lineHeight:50,letterSpacing:-3,color:'#073B2E'}}>W</Text>
    </View>
  );
}
function Splash() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="#073B2E" />
      <WefyxLoader size={80} />
      <Text className="font-extrabold mt-5 text-4xl text-white">
        wefyx.pro
      </Text>
      <Text className="font-semibold mt-2 text-xs tracking-widest text-white/70">
        IT SUPPORT + ASSET RENTAL
      </Text>
      <Text className="mt-8 font-medium text-xs text-white/70">
        Loading your workspace
      </Text>
      <Text className="font-regular absolute bottom-10 text-xs text-white/60">
        Wefyx Technologies
      </Text>
    </SafeAreaView>
  );
}
function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [busy, setBusy] = useState(false),
    [showPassword, setShowPassword] = useState(false),
    [forgot, setForgot] = useState(false),
    [registering,setRegistering]=useState(false),
    [otpPending,setOtpPending]=useState(false),
    [loginPhone,setLoginPhone]=useState(''),
    [loginOtp,setLoginOtp]=useState(''),
    [message, setMessage] = useState('');
  const normalizePhone=(value:string)=>{const clean=value.trim().replace(/[\s()-]/g,'');return clean.startsWith('+')?clean:`+971${clean.replace(/^0/,'')}`;};
  async function finishLogin(session:{token:string;user:{name:string;email:string;role:string}}){
    if (session.user.role !== 'CUSTOMER') {
      throw new Error('This account is not authorized for the Customer app.');
    }
    await Promise.all([
      saveSessionToken(session.token),
      AsyncStorage.setItem('wefyx-user', JSON.stringify(session.user)),
    ]);
    setPassword('');
    setLoginOtp('');
    setOtpPending(false);
    onLogin();
  }
  async function login() {
    setMessage('');
    const identifier=email.trim();
    const isPhone=/^\+?\d[\d\s()-]+$/.test(identifier);
    if (!isPhone && !/^\S+@\S+\.\S+$/.test(identifier)) {
      setMessage('Enter a valid email address or UAE mobile number.');
      return;
    }
    if (password.length < 6) {
      setMessage('Password must contain at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      if(isPhone){
        const sent=await apiRequestLoginOtp(normalizePhone(identifier),password);
        setLoginPhone(sent.phone);
        setLoginOtp('');
        setOtpPending(true);
        setMessage(sent.message);
        return;
      }
      await finishLogin(await apiLogin(identifier, password));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  }
  async function verifyPhoneLogin(){
    setMessage('');
    if(!/^[0-9]{6}$/.test(loginOtp)){setMessage('Enter the 6-digit OTP.');return;}
    setBusy(true);
    try{await finishLogin(await apiVerifyPhoneLogin(loginPhone,password,loginOtp));}
    catch(error){setMessage(error instanceof Error ? error.message : 'Unable to verify OTP.');}
    finally{setBusy(false);}
  }
  if(registering)return <Registration role="CUSTOMER" onBack={()=>setRegistering(false)} onRegistered={value=>{setEmail(value);setPassword('');setRegistering(false)}}/>;
  return (
    <SafeAreaView className="flex-1 bg-primary">
      <Pressable onPress={() => openWebsite('/')} className="px-5 py-3"><Text className="font-bold text-white">Explore Wefyx website</Text></Pressable>
      <StatusBar barStyle="light-content" backgroundColor="#073B2E" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="flex-grow justify-between px-6 pb-7 pt-5"
        >
          <View>
            <View className="items-center py-7">
              <BrandMark />
              <View className="mt-4 items-center">
                <Text className="font-extrabold text-4xl text-white">
                  wefyx.pro
                </Text>
                <Text className="font-semibold mt-2 text-xs tracking-widest text-white/70">
                  IT SUPPORT + ASSET RENTAL
                </Text>
              </View>
            </View>
            <View className="rounded-[30px] bg-white p-6 shadow-lg">
              {forgot ? (
                <>
                  <Pressable onPress={() => {setForgot(false); setMessage('');}}><Text className="font-bold text-primary">Back to sign in</Text></Pressable>
                  <Text className="mt-6 text-2xl font-bold text-ink">Reset password</Text>
                  <Text className="mt-3 text-slate-500">Continue with the website's password recovery flow in your browser.</Text>
                  <Pressable onPress={() => openWebsite('/forgot-password')} className="mt-6 rounded-xl bg-primary p-4"><Text className="text-center font-bold text-white">Open password recovery</Text></Pressable>
                </>
              ) : (
                <>
                  <Text className="font-bold text-3xl text-textPrimary">
                    Welcome back
                  </Text>
                  <Text className="font-regular mt-2 text-sm text-textSecondary">
                    Sign in to manage support operations.
                  </Text>
                  <Text className="font-semibold mb-2 mt-7 text-xs text-textSecondary">
                    EMAIL OR MOBILE
                  </Text>
                  <View className="h-14 flex-row items-center rounded-2xl bg-inputBg px-4">
                    <Mail size={18} color="#075438" />
                    <TextInput
                      value={email}
                      onChangeText={(value)=>{setEmail(value);setOtpPending(false);setLoginOtp('');}}
                      autoCapitalize="none"
                      autoComplete="off"
                      textContentType="none"
                      keyboardType="email-address"
                      placeholder="name@company.com or +971501234567"
                      placeholderTextColor="#8A9F93"
                      className="font-regular ml-3 h-12 flex-1 text-textPrimary"
                    />
                  </View>
                  {otpPending ? (
                    <>
                      <Text className="font-semibold mb-2 mt-4 text-xs text-textSecondary">
                        SMS OTP
                      </Text>
                      <View className="h-14 flex-row items-center rounded-2xl bg-inputBg px-4">
                        <Phone size={18} color="#075438" />
                        <TextInput
                          value={loginOtp}
                          onChangeText={(value)=>setLoginOtp(value.replace(/\D/g,'').slice(0,6))}
                          keyboardType="number-pad"
                          placeholder="6-digit code"
                          placeholderTextColor="#8A9F93"
                          className="font-regular ml-3 h-12 flex-1 text-textPrimary"
                        />
                      </View>
                    </>
                  ) : null}
                  <View className="mb-2 mt-4 flex-row items-center justify-between">
                    <Text className="font-semibold text-xs text-textSecondary">
                      PASSWORD
                    </Text>
                    <Pressable
                      onPress={() => {
                        setForgot(true);
                        setMessage('');
                      }}
                    >
                      <Text className="font-medium text-xs text-accent">
                        Forgot password?
                      </Text>
                    </Pressable>
                  </View>
                  <View className="h-14 flex-row items-center rounded-2xl bg-inputBg px-4">
                    <KeyRound size={18} color="#075438" />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      autoComplete="off"
                      textContentType="none"
                      secureTextEntry={!showPassword}
                      placeholder="Enter your password"
                      placeholderTextColor="#8A9F93"
                      className="font-regular ml-3 h-12 flex-1 text-textPrimary"
                    />
                    <Pressable onPress={() => setShowPassword(value => !value)}>
                      {showPassword ? (
                        <EyeOff size={19} color="#63796C" />
                      ) : (
                        <Eye size={19} color="#63796C" />
                      )}
                    </Pressable>
                  </View>
                  {message ? (
                    <Text className="mt-3 text-xs font-semibold text-red-500">
                      {message}
                    </Text>
                  ) : null}
                  <Pressable
                    disabled={busy}
                    onPress={otpPending?verifyPhoneLogin:login}
                    className="mt-6 h-14 items-center justify-center rounded-2xl bg-primary"
                  >
                    {busy ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="font-semibold text-base text-white">
                        {otpPending?'Verify OTP & sign in':'Sign in securely'}
                      </Text>
                    )}
                  </Pressable>
                  <View className="mt-5 rounded-xl bg-inputBg p-3">
                    <Text className="font-medium text-center text-xs text-primary">
                      Use your Wefyx customer account
                    </Text>
                  </View>
                  <View className="mt-6 border-t border-slate-200 pt-5">
                    <Text className="text-center text-xs font-medium text-slate-500">
                      New to Wefyx?
                    </Text>
                    <Pressable
                      onPress={() => setRegistering(true)}
                      className="mt-3 h-14 items-center justify-center rounded-2xl border-2 border-primary bg-white"
                    >
                      <Text className="text-base font-bold text-primary">
                        Create customer account
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </View>
          <View className="mt-8 items-center">
            <Text className="font-regular text-xs text-white/70">
              Protected by enterprise-grade security
            </Text>
            <Text className="font-semibold mt-2 text-xs text-white">
              © 2026 Wefyx Technologies
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CustomerHome() {
  const [tickets, setTickets] = useState<Ticket[]>([]),
    [loading, setLoading] = useState(true),
    [sessionUser, setSessionUser] = useState<{ name: string; email: string; role: string } | null>(null);
  useFocusEffect(React.useCallback(() => { load(); }, []));
  const navigation = useNavigation<any>();
  async function load() {
    setLoading(true);
    try {
      setTickets((await apiGet<any[]>('/requirements?view=customer')).map(requirementToTicket));
    } catch {
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    AsyncStorage.getItem('wefyx-user').then(value => {
      if (value) setSessionUser(JSON.parse(value));
    });
  }, []);
  const services = [
    ['Products', Box],
    ['Services', Wrench],
    ['Rentals', CalendarDays],
    ['Custom Request', FileText],
  ];
  return (
    <SafeAreaView className="flex-1 bg-primary" edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#008553" />
      <ScrollView
        className="bg-background"
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={load} />
        }
        contentContainerClassName="pb-28"
      >
        <View className="bg-primary px-5 pb-7 pt-5">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-regular text-xs text-white/70">
                Good morning,
              </Text>
              <Text className="font-bold mt-1 text-2xl text-white">
                {sessionUser?.name || 'Wefyx User'}
              </Text>
              <Text className="font-regular mt-1 text-xs text-white/70">
                How can we help you today?
              </Text>
            </View>
            <View className="flex-row gap-2">
              <Pressable onPress={() => navigation.navigate('Help')} className="h-10 w-10 items-center justify-center rounded-full bg-white/15">
                <CircleHelp size={20} color="white" />
              </Pressable>
              <Pressable onPress={() => navigation.navigate('Notifications')} className="relative h-10 w-10 items-center justify-center rounded-full bg-white/15">
                <Bell size={20} color="white" />
                <View className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-400" />
              </Pressable>
            </View>
          </View>
          <View className="mt-5 h-12 flex-row items-center rounded-2xl bg-white px-4">
            <Search size={18} color="#52675B" />
            <Text className="font-regular ml-3 text-sm text-textPlaceholder">
              Search services...
            </Text>
          </View>
        </View>
        <View className="px-5 pt-5">
          <Pressable onPress={() => navigation.navigate('Shop')} className="mb-3 rounded-2xl border border-primary bg-white p-4"><Text className="font-bold text-primary">Explore products and rentals</Text><Text className="mt-1 text-xs text-slate-500">Buy or rent live inventory directly in the Wefyx app</Text></Pressable>
          <Pressable
            onPress={() => navigation.navigate('BookSupport')}
            className="h-14 flex-row items-center justify-between rounded-2xl bg-primary px-5"
          >
            <View className="flex-row items-center">
              <Headphones size={21} color="white" />
              <Text className="font-semibold ml-3 text-base text-white">
                Submit a Requirement
              </Text>
            </View>
            <ChevronRight size={20} color="white" />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Assets')}
            className="mt-3 h-14 flex-row items-center justify-between rounded-2xl border border-primary bg-white px-5"
          >
            <View className="flex-row items-center">
              <Box size={21} color="#008553" />
              <Text className="font-semibold ml-3 text-base text-primary">
                Rent an Asset
              </Text>
            </View>
            <ChevronRight size={20} color="#008553" />
          </Pressable>
          <View className="mt-5 flex-row gap-3">
            {[
              ['Open', tickets.filter(x => ['SUBMITTED', 'UNDER_REVIEW'].includes(x.status)).length, '#F59E0B'],
              ['In progress', tickets.filter(x => ['IN_PROGRESS', 'ACCEPTED', 'SENT_TO_VENDOR'].includes(x.status)).length, '#008553'],
              ['Resolved', tickets.filter(x => ['RESOLVED', 'CLOSED'].includes(x.status)).length, '#008553'],
            ].map(([label, value, color]: any) => (
              <View key={label} className="flex-1 rounded-2xl border border-border bg-white p-3">
                <Text className="font-black text-xl" style={{ color }}>{value}</Text>
                <Text className="font-medium mt-1 text-[10px] text-textSecondary">{label}</Text>
              </View>
            ))}
          </View>
          <View className="mt-7 flex-row items-center justify-between">
            <Text className="font-bold text-lg text-textPrimary">
              Popular Categories
            </Text>
            <Text className="font-medium text-xs text-accent">View all</Text>
          </View>
          <View className="mt-3 flex-row justify-between">
            {services.map(([label, Icon]: any) => (
              <Pressable
                key={label}
                onPress={() => navigation.navigate('BookSupport')}
                className="w-[23%] items-center"
              >
                <View className="h-14 w-14 items-center justify-center rounded-2xl bg-inputBg">
                  <Icon size={22} color="#008553" />
                </View>
                <Text className="font-medium mt-2 text-center text-[10px] text-textPrimary">
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View className="mt-7 flex-row items-center justify-between">
            <Text className="font-bold text-lg text-textPrimary">
              My Tickets
            </Text>
            <Pressable onPress={() => navigation.navigate('Tickets')}>
              <Text className="font-medium text-xs text-accent">View all</Text>
            </Pressable>
          </View>
          {tickets.slice(0, 2).map(ticket => (
            <Pressable
              key={ticket.id}
              onPress={() =>
                ticket.status === 'IN_PROGRESS'
                  ? navigation.navigate('TrackTechnician', { ticket })
                  : navigation.navigate('TicketDetails', { ticket })
              }
              className="mt-3 rounded-2xl border border-border bg-white p-4"
            >
              <View className="flex-row justify-between">
                <Text className="font-semibold text-xs text-primary">
                  #{ticket.reference}
                </Text>
                <Badge value={ticket.status} />
              </View>
              <Text className="font-medium mt-2 text-sm text-textPrimary">
                {ticket.subject}
              </Text>
              <Text className="font-regular mt-2 text-xs text-textSecondary">
                {ticket.category} · {ticket.priority}
              </Text>
            </Pressable>
          ))}
          {!loading && tickets.length === 0 && (
            <View className="mt-3 items-center rounded-2xl border border-dashed border-blue-200 bg-blue-50 px-5 py-6">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-white">
                <CheckCircle2 size={22} color="#008553" />
              </View>
              <Text className="font-bold mt-3 text-sm text-textPrimary">Everything is running smoothly</Text>
              <Text className="font-regular mt-1 text-center text-xs leading-5 text-textSecondary">No active support requests. Our team is ready whenever you need help.</Text>
              <Pressable onPress={() => navigation.navigate('BookSupport')} className="mt-4 rounded-xl bg-primary px-5 py-3">
                <Text className="font-semibold text-xs text-white">Create support request</Text>
              </Pressable>
            </View>
          )}
          <View className="mt-7 flex-row items-center justify-between">
            <Text className="font-bold text-lg text-textPrimary">
              Quick Access
            </Text>
          </View>
          <View className="mt-3 flex-row gap-3">
            <Pressable
              onPress={() => navigation.navigate('TrackTechnician')}
              className="flex-1 rounded-2xl bg-white p-4"
            >
              <MapPin size={22} color="#008553" />
              <Text className="font-semibold mt-3 text-sm text-textPrimary">
                Track Technician
              </Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('ContractDetails')}
              className="flex-1 rounded-2xl bg-white p-4"
            >
              <FileText size={22} color="#008553" />
              <Text className="font-semibold mt-3 text-sm text-textPrimary">
                My Contract
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      {loading && <CenteredPageLoader />}
    </SafeAreaView>
  );
}

function BookSupport({ navigation }: any) {
  const categories = ['General service', 'IT support', 'Hardware / equipment', 'Software / licensing', 'Professional service', 'Other'],
    urgencyOptions = ['Low', 'Medium', 'High', 'Urgent'];
  const [category, setCategory] = useState('General service'),
    [customCategory, setCustomCategory] = useState(''),
    [urgency, setUrgency] = useState('Medium'),
    [title, setTitle] = useState(''),
    [description, setDescription] = useState(''),
    [quotationRequested, setQuotationRequested] = useState(true),
    [preferredDate, setPreferredDate] = useState(() => new Date(Date.now() + 60 * 60 * 1000)),
    [busy, setBusy] = useState(false),
    [images, setImages] = useState<ImageAsset[]>([]),
    [customerName, setCustomerName] = useState('Wefyx User'),
    [organization, setOrganization] = useState(''),
    [createdRequest, setCreatedRequest] = useState<Ticket | null>(null);
  useEffect(() => {
    AsyncStorage.getItem('wefyx-user').then(value => {
      if (value) { const user = JSON.parse(value); setCustomerName(user.name || 'Wefyx User'); setOrganization(user.organization || ''); }
    });
  }, []);
  async function addImages() {
    const result = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 5, quality: 0.8 });
    if (!result.didCancel && result.assets) setImages(result.assets);
  }
  async function submit() {
    if (busy) return;
    if (images.some(image => (image.fileSize || 0) > 10 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(image.type || 'image/jpeg'))) {
      Alert.alert('Unsupported photo', 'Choose JPEG, PNG or WebP photos of 10 MB or less.'); return;
    }
    if (!title.trim() || !description.trim()) {
      Alert.alert('Requirement details needed', 'Enter a title and describe what your organization needs.');
      return;
    }
    setBusy(true);
    try {
      const ticket = createdRequest || await apiSend<Ticket>('/requirements', 'POST', {
        title: title.trim(),
        description: `${description.trim()}\nPreferred service time: ${preferredDate.toLocaleString()}`,
        customerName,
        organization,
        priority: urgency,
        category: category === 'Other' ? customCategory.trim() || 'Other' : category,
        quotationRequested,
      });
      setCreatedRequest(ticket);
      if (images.length) await apiUpload(`/requirements/${ticket.id}/attachments`, images);
      Alert.alert('Requirement submitted', `${ticket.reference} is now with the Wefyx support team.`, [{text:'Done',onPress:()=>navigation.goBack()}]);
    } catch (error) {
      Alert.alert('Submission incomplete', `${error instanceof Error ? error.message : 'Please try again.'} Retry to finish submitting; a saved requirement will not be duplicated.`);
    } finally {
      setBusy(false);
    }
  }
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="px-5 pb-8 pt-4">
        <Pressable
          onPress={() => navigation.goBack()}
          className="mb-5 flex-row items-center"
        >
          <ArrowLeft size={20} color="#14291F" />
          <Text className="font-semibold ml-3 text-lg text-textPrimary">
            Submit a Requirement
          </Text>
        </Pressable>
        <Text className="font-bold text-base text-textPrimary">
          Requirement details
        </Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="What product, service, rental or support do you need?" className="mt-3 rounded-2xl border border-border bg-white px-4 py-4 font-regular text-sm text-textPrimary" />
        <TextInput value={description} onChangeText={setDescription} placeholder="Describe the requirement, quantity, location, expected outcome, deadline and any special conditions" multiline textAlignVertical="top" className="mt-3 min-h-28 rounded-2xl border border-border bg-white px-4 py-4 font-regular text-sm text-textPrimary" />
        <Text className="font-bold mt-7 text-base text-textPrimary">Requirement Category</Text>
        <View className="mt-3 flex-row flex-wrap justify-between gap-y-3">
          {categories.map(item => (
            <Pressable
              key={item}
              onPress={() => setCategory(item)}
              className={`w-[31%] items-center rounded-2xl border py-4 ${
                category === item
                  ? 'border-primary bg-blue-50'
                  : 'border-border bg-white'
              }`}
            >
              <Wrench size={21} color="#008553" />
              <Text className="font-medium mt-2 text-xs text-textPrimary">
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
        {category === 'Other' && (
          <TextInput
            value={customCategory}
            onChangeText={setCustomCategory}
            placeholder="Enter your requirement category"
            className="mt-3 rounded-2xl border border-border bg-white px-4 py-4 font-regular text-sm text-textPrimary"
          />
        )}
        <Text className="font-bold mt-7 text-base text-textPrimary">
          Urgency
        </Text>
        {urgencyOptions.map(name => (
          <Pressable
            key={name}
            onPress={() => setUrgency(name)}
            className={`mt-3 flex-row items-center justify-between rounded-2xl border p-4 ${
              urgency === name
                ? 'border-primary bg-blue-50'
                : 'border-border bg-white'
            }`}
          >
            <Text className="font-medium text-sm text-textPrimary">{name}</Text>
          </Pressable>
        ))}
        <Text className="font-bold mt-7 text-base text-textPrimary">
          Preferred Time
        </Text>
        <Pressable
          onPress={() => setPreferredDate(value => new Date(value.getTime() + 24 * 60 * 60 * 1000))}
          className="mt-3 flex-row items-center rounded-2xl bg-white p-4"
        >
          <CalendarDays size={20} color="#008553" />
          <Text className="font-regular ml-3 flex-1 text-sm text-textPrimary">
            {preferredDate.toLocaleString()}
          </Text>
          <ChevronRight size={18} color="#8A9F93" />
        </Pressable>
        <Text className="font-bold mt-7 text-base text-textPrimary">Attachments</Text>
        <Pressable onPress={addImages} className="mt-3 items-center justify-center rounded-2xl border border-dashed border-blue-300 bg-white px-4 py-5">
          <Plus size={22} color="#008553" />
          <Text className="mt-2 text-sm font-semibold text-primary">Add images from gallery</Text>
          <Text className="mt-1 text-xs text-textSecondary">Up to 5 photos</Text>
        </Pressable>
        {images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 pt-3">
            {images.map((image, index) => (
              <View key={image.uri || String(index)} className="overflow-hidden rounded-xl border border-border bg-white">
                {image.uri && <Image source={{ uri: image.uri }} className="h-20 w-20" resizeMode="cover" />}
              </View>
            ))}
          </ScrollView>
        )}
        <Pressable onPress={() => setQuotationRequested(v => !v)} className={`mt-6 flex-row items-center justify-between rounded-2xl border p-4 ${quotationRequested ? 'border-primary bg-blue-50' : 'border-border bg-white'}`}>
          <View className="flex-1 pr-4"><Text className="font-semibold text-sm text-textPrimary">Request a quotation</Text><Text className="mt-1 text-xs text-textSecondary">Wefyx will review your requirement and invite a suitable vendor or service provider to accept the estimated amount.</Text></View>
          <View className={`h-6 w-6 items-center justify-center rounded-full border ${quotationRequested ? 'border-primary bg-primary' : 'border-border'}`}>{quotationRequested && <CheckCircle2 size={15} color="white" />}</View>
        </Pressable>
        <Pressable
          disabled={busy}
          onPress={submit}
          className="mt-8 h-14 items-center justify-center rounded-2xl bg-primary"
        >
          {busy ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="font-semibold text-base text-white">Submit requirement</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function TrackTechnician({ navigation, route }: any) {
  const ticket: Ticket | undefined = route.params?.ticket;
  const [locationPermission, setLocationPermission] = useState<LocationPermissionState>('denied');
  useEffect(() => {
    checkLocationPermission().then(setLocationPermission).catch(() => setLocationPermission('unavailable'));
  }, []);
  async function enableLocation() {
    if (locationPermission === 'blocked') {
      await openLocationSettings();
      return;
    }
    setLocationPermission(await requestLocationPermission());
  }
  const assigned = Boolean(ticket?.assignee && ticket.assignee !== 'Support Queue');
  const initials = ticket?.assignee
    ? ticket.assignee.split(' ').map(value => value[0]).join('').slice(0, 2).toUpperCase()
    : '—';
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center bg-white px-5 py-4">
        <Pressable onPress={() => navigation.goBack()}>
          <ArrowLeft size={21} color="#14291F" />
        </Pressable>
        <Text className="font-semibold ml-3 text-lg text-textPrimary">
          Track Technician
        </Text>
      </View>
      <ScrollView className="flex-1 bg-blue-50 px-5" contentContainerClassName="pb-10 pt-6">
        <View className="items-center rounded-3xl border border-blue-100 bg-white px-6 py-10">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-blue-50">
            <MapPin size={34} color="#008553" />
          </View>
          <Text className="mt-5 text-xl font-bold text-textPrimary">
            {ticket ? (assigned ? 'Technician assigned' : 'Awaiting assignment') : 'No active tracking request'}
          </Text>
          <Text className="mt-2 text-center text-sm leading-6 text-textSecondary">
            {ticket
              ? 'Assignment and ticket progress shown here are synchronized with the Wefyx support system.'
              : 'Open a ticket from the Tickets tab to view its live assignment and progress.'}
          </Text>
          {!['granted', 'limited'].includes(locationPermission) && (
            <Pressable onPress={enableLocation} className="mt-5 rounded-2xl bg-primary px-5 py-3">
              <Text className="font-semibold text-white">
                {locationPermission === 'blocked' ? 'Open location settings' : 'Allow location access'}
              </Text>
            </Pressable>
          )}
          {['granted', 'limited'].includes(locationPermission) && (
            <View className="mt-5 flex-row items-center rounded-full bg-emerald-50 px-4 py-2">
              <MapPin size={15} color="#008553" />
              <Text className="ml-2 text-xs font-semibold text-emerald-700">Location access enabled</Text>
            </View>
          )}
        </View>
        {ticket && <View className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
          <View className="flex-row items-center">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-primary">
              <Text className="font-semibold text-white">{initials}</Text>
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-semibold text-base text-textPrimary">
                {ticket.assignee || 'Support Queue'}
              </Text>
              <Text className="font-regular text-xs text-textSecondary">
                {ticket.reference} · {ticket.category}
              </Text>
            </View>
            <Badge value={ticket.status} />
          </View>
          <Text className="mt-5 text-sm leading-6 text-textSecondary">{ticket.subject}</Text>
          <Pressable onPress={() => navigation.navigate('TicketDetails', { ticket })} className="mt-5 h-13 items-center justify-center rounded-2xl bg-primary">
            <Text className="font-semibold text-white">View Details</Text>
          </Pressable>
        </View>}
      </ScrollView>
    </SafeAreaView>
  );
}

function ContractDetails() {
  const [contracts, setContracts] = useState<ResourceRecord[]>([]),
    [tickets, setTickets] = useState<Ticket[]>([]),
    [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  async function load() {
    setLoading(true);
    try {
      const [contractData, ticketData] = await Promise.all([
        apiGet<ResourceRecord[]>('/resources/contracts'),
        apiGet<Ticket[]>('/tickets'),
      ]);
      setContracts(contractData);
      setTickets(ticketData);
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) {
        Alert.alert('Unable to load contracts', error instanceof Error ? error.message : 'Please try again.');
      }
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  const active = contracts.filter(x => x.status?.toLowerCase() === 'active').length;
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView className="bg-background" refreshControl={<RefreshControl refreshing={false} onRefresh={load} />} contentContainerClassName="pb-28">
        <TabHero title="My Contracts" subtitle="Coverage, renewals and service entitlement" icon={FileText} />
        <View className="px-5 pt-5">
        <View className="flex-row gap-3">
          <View className="flex-1 rounded-2xl border border-border bg-white p-4">
            <Text className="text-2xl font-black text-ink">{contracts.length}</Text>
            <Text className="mt-1 text-xs text-slate-500">Total contracts</Text>
          </View>
          <View className="flex-1 rounded-2xl border border-border bg-white p-4">
            <Text className="text-2xl font-black text-emerald-600">{active}</Text>
            <Text className="mt-1 text-xs text-slate-500">Active</Text>
          </View>
          <View className="flex-1 rounded-2xl border border-border bg-white p-4">
            <Text className="text-2xl font-black text-blue-600">{tickets.length}</Text>
            <Text className="mt-1 text-xs text-slate-500">Service tickets</Text>
          </View>
        </View>
        <Text className="mb-3 mt-6 text-lg font-bold text-textPrimary">Contract portfolio</Text>
        {contracts.map(contract => (
          <View key={contract.id} className="mb-3 rounded-2xl border border-border bg-white p-4">
            <View className="flex-row items-start justify-between"><View className="mr-3 flex-1"><Text className="text-base font-black text-ink">{contract.name}</Text><Text className="mt-1 text-xs text-slate-500">{contract.owner || 'No provider assigned'}</Text></View><Badge value={(contract.status || 'NOT_SET').toUpperCase()} /></View>
            <Text className="mt-4 text-xs leading-5 text-slate-600">{contract.details || 'No contract details have been added yet.'}</Text>
            <View className="mt-4 flex-row items-center border-t border-slate-100 pt-4"><FileText size={17} color={purple} /><Text className="ml-2 text-xs font-bold text-brand">Contract #{contract.id}</Text><Text className="ml-auto text-[10px] text-slate-400">{contract.updatedAt ? new Date(contract.updatedAt).toLocaleDateString() : ''}</Text></View>
          </View>
        ))}
        {!loading && contracts.length === 0 && <View className="mt-5 items-center rounded-3xl border border-dashed border-blue-200 bg-white px-7 py-10"><FileText size={34} color={purple}/><Text className="mt-4 text-lg font-black text-ink">No contracts available</Text><Text className="mt-2 text-center text-xs leading-5 text-slate-500">Contracts created in the admin portal will appear here automatically.</Text></View>}
        {contracts.length > 0 && (
          <Pressable onPress={() => navigation.navigate('Tickets')} className="mt-3 h-13 items-center justify-center rounded-xl bg-primary">
            <Text className="text-sm font-semibold text-white">View Service Tickets</Text>
          </Pressable>
        )}
        </View>
      </ScrollView>
      {loading && <CenteredPageLoader />}
    </SafeAreaView>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function AsanaDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]),
    [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  async function load() {
    setLoading(true);
    try {
      setTickets(await apiGet('/tickets'));
    } catch {
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  const open = tickets.filter(ticket => ticket.status === 'OPEN');
  const working = tickets.filter(ticket =>
    ['IN_PROGRESS', 'PENDING'].includes(ticket.status),
  );
  const complete = tickets.filter(ticket =>
    ['RESOLVED', 'CLOSED'].includes(ticket.status),
  );
  const categories = Array.from(new Set(tickets.map(ticket => ticket.category)))
    .filter(Boolean)
    .slice(0, 5);
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={load} />
        }
        contentContainerClassName="pb-28"
      >
        <View className="px-5 pb-4 pt-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-regular text-sm text-textSecondary">
                Good morning
              </Text>
              <Text className="font-bold mt-1 text-2xl text-textPrimary">
                My workspace
              </Text>
            </View>
            <View className="h-11 w-11 items-center justify-center rounded-full bg-primary">
              <Text className="font-semibold text-sm text-white">SA</Text>
            </View>
          </View>
          <Pressable className="mt-5 h-12 flex-row items-center rounded-2xl bg-inputBg px-4">
            <Search size={18} color="#52675B" />
            <Text className="font-regular ml-3 text-sm text-textPlaceholder">
              Search tickets, people, or projects
            </Text>
          </Pressable>
        </View>
        <View className="border-y border-border bg-background px-5 py-5">
          <View className="flex-row items-center justify-between">
            <Text className="font-bold text-xl text-textPrimary">My tasks</Text>
            <Pressable onPress={() => navigation.navigate('Tickets')}>
              <Text className="font-medium text-sm text-accent">View all</Text>
            </Pressable>
          </View>
          <View className="mt-4 flex-row rounded-2xl border border-border bg-white p-4">
            {[
              [open.length, 'Open', '#F59E0B'],
              [working.length, 'In progress', '#00A86B'],
              [complete.length, 'Completed', '#008553'],
            ].map(([value, label, color], index) => (
              <View
                key={String(label)}
                className={`flex-1 items-center ${
                  index < 2 ? 'border-r border-border' : ''
                }`}
              >
                <Text
                  className="font-bold text-2xl"
                  style={{ color: String(color) }}
                >
                  {value}
                </Text>
                <Text className="font-regular mt-1 text-[11px] text-textSecondary">
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <View className="py-5">
          <View className="flex-row items-center justify-between px-5">
            <Text className="font-bold text-xl text-textPrimary">Projects</Text>
            <MoreHorizontal size={22} color="#52675B" />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-3 px-5 pt-4"
          >
            {categories.map((category, index) => {
              const count = tickets.filter(
                ticket => ticket.category === category,
              ).length;
              const colors = [
                '#008553',
                '#42BB88',
                '#008553',
                '#E05D44',
                '#D97706',
              ];
              return (
                <Pressable
                  key={category}
                  onPress={() => navigation.navigate('Tickets')}
                  className="w-44 rounded-2xl p-4"
                  style={{ backgroundColor: colors[index % colors.length] }}
                >
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                    <TicketIcon size={18} color="white" />
                  </View>
                  <Text
                    className="font-semibold mt-7 text-base text-white"
                    numberOfLines={1}
                  >
                    {category}
                  </Text>
                  <Text className="font-regular mt-1 text-xs text-white/70">
                    {count} active {count === 1 ? 'item' : 'items'}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
        <View className="px-5 pb-5">
          <View className="flex-row items-center justify-between">
            <Text className="font-bold text-xl text-textPrimary">Upcoming</Text>
            <Text className="font-medium text-sm text-accent">This week</Text>
          </View>
          <View className="mt-3 overflow-hidden rounded-2xl border border-border bg-white">
            {tickets.slice(0, 5).map((ticket, index) => (
              <Pressable
                key={ticket.id}
                onPress={() => navigation.navigate('TicketDetails', { ticket })}
                className={`flex-row items-center px-4 py-4 ${
                  index < Math.min(tickets.length, 5) - 1
                    ? 'border-b border-border'
                    : ''
                }`}
              >
                <View
                  className={`h-5 w-5 rounded-full border-2 ${
                    ['RESOLVED', 'CLOSED'].includes(ticket.status)
                      ? 'border-emerald-500 bg-emerald-500'
                      : 'border-textMuted'
                  }`}
                >
                  {['RESOLVED', 'CLOSED'].includes(ticket.status) && (
                    <CheckCircle2 size={16} color="white" />
                  )}
                </View>
                <View className="ml-3 flex-1">
                  <Text
                    className="font-medium text-sm text-textPrimary"
                    numberOfLines={1}
                  >
                    {ticket.subject}
                  </Text>
                  <Text className="font-regular mt-1 text-[11px] text-textSecondary">
                    {ticket.reference} · {ticket.category}
                  </Text>
                </View>
                <ChevronRight size={18} color="#8A9F93" />
              </Pressable>
            ))}
            {!loading && tickets.length === 0 && (
              <View className="items-center px-5 py-10">
                <CheckCircle2 size={34} color="#008553" />
                <Text className="font-semibold mt-3 text-sm text-textPrimary">
                  You are all caught up
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      <Pressable
        onPress={() => navigation.navigate('Tickets')}
        className="absolute bottom-24 right-5 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg"
      >
        <Plus size={27} color="white" />
      </Pressable>
    </SafeAreaView>
  );
}

// Kept temporarily as a reference while the new home experience is rolled out.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Dashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]),
    [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  async function load() {
    try {
      setTickets(await apiGet('/tickets'));
    } catch {
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  const counts = [
    tickets.filter(x => ['SUBMITTED', 'UNDER_REVIEW'].includes(x.status)).length,
    tickets.filter(x => x.status === 'IN_PROGRESS').length,
    tickets.filter(x => x.status === 'PENDING').length,
    tickets.filter(x => ['RESOLVED', 'CLOSED'].includes(x.status)).length,
  ];
  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={load} />
        }
        className="px-5"
        contentContainerClassName="pb-28 pt-5"
      >
        <Header
          title="Good morning, Alex"
          subtitle="Here is your support overview"
        />
        <Card className="bg-brand">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-violet-200">
                Available for support
              </Text>
              <Text className="mt-2 text-2xl font-black text-white">
                Employee Dashboard
              </Text>
              <Text className="mt-1 text-xs text-violet-200">
                Wefyx Technologies
              </Text>
            </View>
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
              <Headphones color="white" size={30} />
            </View>
          </View>
        </Card>
        <Text className="mb-3 mt-6 text-base font-black text-ink">
          Today at a glance
        </Text>
        <View className="flex-row flex-wrap justify-between gap-y-3">
          {[
            [counts[0], 'Assigned', Wrench, 'bg-orange-50'],
            [counts[1], 'In Progress', Clock3, 'bg-violet-50'],
            [counts[2], 'Pending', CalendarDays, 'bg-blue-50'],
            [counts[3], 'Completed', CheckCircle2, 'bg-emerald-50'],
          ].map(([n, l, Icon, bg]: any) => (
            <Card key={l} className="w-[48%]">
              <View
                className={`mb-3 h-10 w-10 items-center justify-center rounded-xl ${bg}`}
              >
                <Icon size={19} color={purple} />
              </View>
              <Text className="text-2xl font-black text-ink">{n}</Text>
              <Text className="mt-1 text-xs text-slate-500">{l}</Text>
            </Card>
          ))}
        </View>
        <View className="mb-3 mt-6 flex-row items-center justify-between">
          <Text className="text-base font-black text-ink">Recent tickets</Text>
          <Pressable onPress={() => navigation.navigate('Tickets')}>
            <Text className="text-xs font-bold text-brand">View all</Text>
          </Pressable>
        </View>
        {tickets.slice(0, 3).map(ticket => (
          <Pressable
            key={ticket.id}
            onPress={() => navigation.navigate('TicketDetails', { ticket })}
          >
            <Card className="mb-3">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-[10px] font-bold text-brand">
                    #{ticket.reference}
                  </Text>
                  <Text className="mt-1 font-bold text-ink">
                    {ticket.subject}
                  </Text>
                  <Text className="mt-2 text-xs text-slate-500">
                    {ticket.customer} • {ticket.category}
                  </Text>
                </View>
                <Badge value={ticket.status} />
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function TicketsScreen() {
  const [items, setItems] = useState<Ticket[]>([]),
    [query, setQuery] = useState(''),
    [statusFilter, setStatusFilter] = useState('All'),
    [refreshing, setRefreshing] = useState(false);
  useFocusEffect(React.useCallback(() => { load(); }, []));
  const navigation = useNavigation<any>();
  async function load() {
    setRefreshing(true);
    try {
      setItems((await apiGet<any[]>('/requirements?view=customer')).map(requirementToTicket));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return;
      Alert.alert(
        'Unable to load tickets',
        error instanceof Error
          ? error.message
          : 'Check your internet connection and try again.',
      );
    } finally {
      setRefreshing(false);
    }
  }
  const shown = useMemo(
    () =>
      items.filter(x => {
        const matchesQuery = `${x.reference} ${x.subject} ${x.customer}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesStatus = statusFilter === 'All'
          || (statusFilter === 'Open' && ['SUBMITTED', 'UNDER_REVIEW'].includes(x.status))
          || (statusFilter === 'In Progress' && ['IN_PROGRESS', 'ACCEPTED', 'SENT_TO_VENDOR'].includes(x.status))
          || (statusFilter === 'Quotes' && x.quotationStatus === 'SHARED_WITH_CUSTOMER')
          || (statusFilter === 'Resolved' && ['RESOLVED', 'CLOSED'].includes(x.status));
        return matchesQuery && matchesStatus;
      }),
    [items, query, statusFilter],
  );
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View className="flex-1 bg-background">
        <TabHero title="Support Tickets" subtitle={`${items.length} requests · Track progress and updates`} icon={TicketIcon} />
      <View className="px-5 pt-5">
        <View className="mb-4 flex-row rounded-xl bg-inputBg p-1">
          {['All', 'Open', 'In Progress', 'Quotes', 'Resolved'].map(value => (
            <Pressable key={value} onPress={() => setStatusFilter(value)} className={`flex-1 items-center rounded-lg py-2 ${statusFilter === value ? 'bg-primary' : ''}`}>
              <Text className={`text-[10px] font-semibold ${statusFilter === value ? 'text-white' : 'text-textSecondary'}`}>{value}</Text>
            </Pressable>
          ))}
        </View>
        <View className="mb-4 flex-row gap-3">
          {[
            ['Open', items.filter(x => ['SUBMITTED', 'UNDER_REVIEW'].includes(x.status)).length, '#F59E0B'],
            ['Working', items.filter(x => ['IN_PROGRESS', 'ACCEPTED', 'SENT_TO_VENDOR'].includes(x.status)).length, '#008553'],
            ['Completed', items.filter(x => ['RESOLVED', 'CLOSED'].includes(x.status)).length, '#008553'],
          ].map(([label, value, color]: any) => (
            <View key={label} className="flex-1 rounded-2xl border border-border bg-white p-3">
              <Text className="text-xl font-black" style={{ color }}>{value}</Text>
              <Text className="mt-1 text-[10px] font-medium text-slate-500">{label}</Text>
            </View>
          ))}
        </View>
        <View className="mb-4 h-12 flex-row items-center rounded-2xl border border-border bg-white px-4">
          <Search size={18} color={muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search tickets..."
            className="h-12 flex-1 px-3 text-ink"
          />
        </View>
      </View>
      <FlatList
        data={shown}
        keyExtractor={x => String(x.id)}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={load} />
        }
        contentContainerClassName="px-5 pb-28 pt-1"
        ListEmptyComponent={
          <View className="mt-8 items-center rounded-3xl border border-dashed border-blue-200 bg-white px-7 py-10">
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
              <TicketIcon size={30} color={purple} />
            </View>
            <Text className="mt-5 text-lg font-black text-ink">No tickets found</Text>
            <Text className="mt-2 text-center text-xs leading-5 text-slate-500">Your support requests, technician updates, SLA status, and resolution history will appear here.</Text>
            <Pressable onPress={() => navigation.navigate('BookSupport')} className="mt-5 rounded-xl bg-primary px-6 py-3">
              <Text className="text-xs font-bold text-white">Submit a requirement</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate('TicketDetails', { ticket: item })
            }
          >
            <View className="mb-3 rounded-2xl border border-border bg-white p-4">
              <View className="flex-row justify-between">
                <Text className="text-[10px] font-bold text-brand">
                  #{item.reference}
                </Text>
                <Badge value={item.status} />
              </View>
              <Text className="mt-2 text-base font-bold text-ink">
                {item.subject}
              </Text>
              <Text className="mt-2 text-xs text-slate-500">
                {item.customer}
              </Text>
              <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-3">
                <Text className="text-xs text-slate-500">
                  {item.category} • {item.priority}
                </Text>
                <ChevronRight size={17} color={purple} />
              </View>
            </View>
          </Pressable>
        )}
      />
      {refreshing && <CenteredPageLoader />}
      </View>
    </SafeAreaView>
  );
}

function TicketDetails({ route, navigation }: any) {
  const [ticket, setTicket] = useState<Ticket>(route.params.ticket),
    [quotes, setQuotes] = useState<VendorQuotation[]>([]),
    [messages, setMessages] = useState<any[]>([]),
    [message, setMessage] = useState(''),
    [saving, setSaving] = useState(false);
  async function loadQuotes() {
    try { setQuotes(await apiGet<VendorQuotation[]>(`/requirements/${ticket.id}/quotations?view=customer`)); } catch { setQuotes([]); }
  }
  useEffect(() => { loadQuotes(); const timer = setInterval(loadQuotes, 15000); return () => clearInterval(timer); }, [ticket.id]);
  async function loadMessages(){try{setMessages(await apiGet<any[]>(`/requirements/${ticket.id}/messages`));}catch{setMessages([])}}
  useEffect(()=>{loadMessages(); const timer = setInterval(loadMessages, 3000); return () => clearInterval(timer);},[ticket.id]);
  async function sendChat(){if(!message.trim() || saving)return;setSaving(true);try{await apiSend(`/requirements/${ticket.id}/messages`,'POST',{message:message.trim(),senderName:ticket.customer,senderRole:'CUSTOMER'});setMessage('');await loadMessages();}catch(error){Alert.alert('Message not sent', error instanceof Error ? error.message : 'Please try again.');}finally{setSaving(false);}}
  async function selectQuote(quotation: VendorQuotation) {
    setSaving(true);
    try {
      await apiSend<Ticket>(
        `/requirements/${ticket.id}/quotations/${quotation.id}/${quotation.status === 'STAFF_APPROVED' ? 'confirm' : 'select'}`,
        'PATCH',
        quotation.status === 'STAFF_APPROVED' ? { decision: 'CONFIRM' } : {},
      );
      setTicket(requirementToTicket(await apiGet(`/requirements/${ticket.id}`))); await loadQuotes();
      Alert.alert('Vendor selected', `${quotation.vendorName} has been awarded this requirement for AED ${quotation.amount}.`);
    } catch {
      Alert.alert('Update failed', 'Could not reach the backend.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <ScrollView className="px-5" contentContainerClassName="pb-12 pt-4">
        <Pressable onPress={() => navigation.goBack()}>
          <Text className="mb-4 font-bold text-brand">‹ Back to tickets</Text>
        </Pressable>
        <Card>
          <View className="flex-row justify-between">
            <Text className="text-xs font-bold text-brand">
              #{ticket.reference}
            </Text>
            <Badge value={ticket.status} />
          </View>
          <Text className="mt-3 text-2xl font-black text-ink">
            {ticket.subject}
          </Text>
          <Text className="mt-2 text-sm text-slate-500">
            {ticket.description || 'Your requirement is being processed by the Wefyx team.'}
          </Text>
        </Card>
        <Text className="mb-3 mt-6 text-base font-black text-ink">
          Ticket information
        </Text>
        <Card>
          {[
            ['Customer', ticket.customer],
            ['Assigned to', ticket.assignee],
            ['Category', ticket.category],
            ['Priority', ticket.priority],
            ['Created', new Date(ticket.createdAt).toLocaleDateString()],
          ].map(([l, v]) => (
            <View
              key={l}
              className="flex-row justify-between border-b border-slate-100 py-3"
            >
              <Text className="text-sm text-slate-500">{l}</Text>
              <Text className="max-w-[60%] text-right text-sm font-bold text-ink">
                {v}
              </Text>
            </View>
          ))}
        </Card>
        {ticket.quotationRequested && <><Text className="mb-3 mt-6 text-base font-black text-ink">Vendor quotations</Text>{quotes.length === 0 ? <Card><Text className="text-sm text-slate-500">The Wefyx employee is collecting vendor quotations. Offers will appear here after review.</Text></Card> : quotes.map(quote => <View key={quote.id} className={`mb-3 rounded-2xl border bg-white p-4 ${['SELECTED', 'FINAL_CONFIRMED'].includes(quote.status) ? 'border-primary' : 'border-border'}`}><View className="flex-row justify-between"><Text className="text-base font-black text-ink">{quote.vendorName}</Text><Text className="text-base font-black text-primary">AED {quote.amount}</Text></View><Text className="mt-2 text-xs text-slate-500">Completion: {quote.leadTimeDays} days</Text>{quote.notes ? <Text className="mt-2 text-sm text-slate-600">{quote.notes}</Text> : null}{['STAFF_APPROVED', 'SHARED_WITH_CUSTOMER'].includes(quote.status) && <Pressable disabled={saving} onPress={() => selectQuote(quote)} className="mt-4 items-center rounded-xl bg-primary py-3"><Text className="text-sm font-bold text-white">Confirm order</Text></Pressable>}{['SELECTED', 'FINAL_CONFIRMED'].includes(quote.status) && <Text className="mt-3 text-sm font-bold text-green-600">Selected and awarded</Text>}</View>)}</>}
        <Text className="mb-3 mt-6 text-base font-black text-ink">Support chat</Text>
        <Card>{messages.map(m=><View key={m.id} className="mb-2 rounded-xl bg-slate-50 p-3"><Text className="text-[10px] font-bold text-primary">{m.senderName} · {m.senderRole}</Text><Text className="mt-1 text-sm text-ink">{m.message}</Text></View>)}{!messages.length&&<Text className="text-sm text-slate-500">No messages yet. Ask the Wefyx team anything about this requirement.</Text>}<View className="mt-3 flex-row gap-2"><TextInput value={message} onChangeText={setMessage} placeholder="Write a message" className="h-12 flex-1 rounded-xl border border-border px-3 text-ink"/><Pressable disabled={saving || !message.trim()} onPress={sendChat} className="h-12 items-center justify-center rounded-xl bg-primary px-4"><Text className="font-bold text-white">Send</Text></Pressable></View></Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Assets() {
  const [assets, setAssets] = useState<ResourceRecord[]>([]),
    [assetFilter, setAssetFilter] = useState('All'),
    [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  async function load() {
    setLoading(true);
    try {
      setAssets(await apiGet<ResourceRecord[]>('/resources/assets'));
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) {
        Alert.alert('Unable to load assets', error instanceof Error ? error.message : 'Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);
  const available = assets.filter(x => x.status?.toLowerCase() === 'available').length;
  const assigned = assets.filter(x => ['assigned', 'rented', 'active'].includes(x.status?.toLowerCase())).length;
  const attention = assets.filter(x => ['maintenance', 'repair', 'expired'].includes(x.status?.toLowerCase())).length;
  const displayedAssets = assets.filter(asset => {
    if (assetFilter === 'All') return true;
    if (assetFilter === 'Rented') return ['rented', 'assigned'].includes(asset.status?.toLowerCase());
    if (assetFilter === 'Leased') return asset.status?.toLowerCase() === 'leased';
    return ['returned', 'available'].includes(asset.status?.toLowerCase());
  });
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView className="bg-background" refreshControl={<RefreshControl refreshing={false} onRefresh={load} />} contentContainerClassName="pb-28">
        <TabHero title="My Assets" subtitle="Assigned equipment, rentals and device health" icon={Package} />
        <View className="px-5 pt-5">
        <View className="mb-5 flex-row rounded-xl bg-inputBg p-1">
          {['All', 'Rented', 'Leased', 'Returned'].map(value => (
            <Pressable key={value} onPress={() => setAssetFilter(value)} className={`flex-1 items-center rounded-lg py-2 ${assetFilter === value ? 'bg-primary' : ''}`}>
              <Text className={`text-[10px] font-semibold ${assetFilter === value ? 'text-white' : 'text-textSecondary'}`}>{value}</Text>
            </Pressable>
          ))}
        </View>
        <View className="mb-3 flex-row gap-3">
          <View className="flex-1 rounded-2xl border border-border bg-white p-4">
            <Text className="text-2xl font-black text-ink">{assets.length}</Text>
            <Text className="mt-1 text-xs text-slate-500">Total assets</Text>
          </View>
          <View className="flex-1 rounded-2xl border border-border bg-white p-4">
            <Text className="text-2xl font-black text-emerald-600">{available}</Text>
            <Text className="mt-1 text-xs text-slate-500">Available</Text>
          </View>
        </View>
        <View className="mb-5 flex-row gap-3">
          <View className="flex-1 rounded-2xl border border-border bg-white p-4">
            <Text className="text-2xl font-black text-blue-600">{assigned}</Text>
            <Text className="mt-1 text-xs text-slate-500">Assigned to me</Text>
          </View>
          <View className="flex-1 rounded-2xl border border-border bg-white p-4">
            <Text className="text-2xl font-black text-amber-600">{attention}</Text>
            <Text className="mt-1 text-xs text-slate-500">Needs attention</Text>
          </View>
        </View>
        <Text className="mb-3 text-lg font-bold text-textPrimary">Asset inventory</Text>
        {displayedAssets.map(asset => (
          <View key={asset.id} className="mb-3 rounded-2xl border border-border bg-white p-4">
            <View className="flex-row items-center">
              <View className="h-12 w-12 items-center justify-center rounded-xl bg-violet-50">
                <Package size={23} color={purple} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="font-bold text-ink">{asset.name}</Text>
                <Text className="mt-1 text-xs text-slate-500">{asset.details || asset.owner}</Text>
              </View>
              <Badge value={(asset.status || 'NOT_SET').toUpperCase()} />
            </View>
          </View>
        ))}
        {!loading && assets.length > 0 && displayedAssets.length === 0 && (
          <View className="items-center rounded-2xl border border-dashed border-border bg-white px-6 py-8">
            <Package size={28} color={purple} />
            <Text className="mt-3 text-sm font-semibold text-textPrimary">No {assetFilter.toLowerCase()} assets</Text>
          </View>
        )}
        {!loading && assets.length === 0 && (
          <View className="items-center rounded-3xl border border-dashed border-blue-200 bg-white px-7 py-10">
            <Package size={34} color={purple} />
            <Text className="mt-4 text-lg font-black text-ink">No assets assigned</Text>
            <Text className="mt-2 text-center text-xs leading-5 text-slate-500">Assets added from the Wefyx admin portal will appear here automatically.</Text>
          </View>
        )}
        {assets.length > 0 && <View className="mt-2 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <View className="flex-row items-center">
            <ShieldCheck size={24} color={purple} />
            <View className="ml-3 flex-1">
              <Text className="font-bold text-ink">Asset protection active</Text>
              <Text className="mt-1 text-xs leading-5 text-slate-500">Warranty, maintenance schedules, and device health are monitored by Wefyx.</Text>
            </View>
          </View>
        </View>}
        <Pressable onPress={() => navigation.navigate('BookSupport')} className="mt-4 h-13 items-center justify-center rounded-xl bg-primary">
          <Text className="text-sm font-semibold text-white">Rent New Asset</Text>
        </Pressable>
        </View>
      </ScrollView>
      {loading && <CenteredPageLoader />}
    </SafeAreaView>
  );
}

function Notifications({ navigation }: any) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  async function load() {
    setLoading(true);
    try { setNotes(await apiGet<any[]>('/notifications')); }
    catch (error) { Alert.alert('Unable to load notifications', error instanceof Error ? error.message : 'Please retry.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  async function open(note: any) {
    try {
      await apiSend(`/notifications/${note.id}/read`, 'PATCH');
      setNotes(rows => rows.map(row => row.id === note.id ? { ...row, read: true } : row));
      if (note.requirementId) {
        const requirement = await apiGet(`/requirements/${note.requirementId}`);
        navigation.navigate('TicketDetails', { ticket: requirementToTicket(requirement) });
      }
    } catch (error) { Alert.alert('Unable to open notification', error instanceof Error ? error.message : 'Please retry.'); }
  }
  return <SafeAreaView className="flex-1 bg-white">
    <Pressable onPress={() => navigation.goBack()} className="p-5"><Text className="font-bold text-brand">Back</Text></Pressable>
    <Text className="px-5 text-xl font-bold text-ink">Notifications</Text>
    <ScrollView className="px-5" refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      {notes.map(note => <Pressable key={note.id} onPress={() => open(note)} className="my-2 rounded-xl border border-border p-4">
        <Text className="font-bold text-ink">{note.read ? '' : '? '}{note.title}</Text>
        <Text className="mt-2 text-slate-600">{note.message}</Text>
        <Text className="mt-2 text-xs text-slate-400">{note.createdAt ? new Date(note.createdAt).toLocaleString() : ''}</Text>
      </Pressable>)}
      {!loading && !notes.length && <Text className="py-8 text-slate-500">No notifications.</Text>}
    </ScrollView>
  </SafeAreaView>;
}

function Help({ navigation }: any) {
  const topics = [
    [Headphones, 'Contact support', 'Create a support request and track its progress', 'BookSupport'],
    [TicketIcon, 'My tickets', 'Review open requests and completed resolutions', 'Tickets'],
    [Package, 'Assets and rentals', 'Get help with assigned or rented equipment', 'Assets'],
    [FileText, 'Contracts and coverage', 'Review your active service agreements', 'Contracts'],
  ];
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View className="h-16 flex-row items-center border-b border-border bg-white px-5">
        <Pressable onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-inputBg">
          <ArrowLeft size={20} color="#14291F" />
        </Pressable>
        <View className="ml-3"><Text className="text-lg font-bold text-textPrimary">Help & Support</Text><Text className="text-xs text-textSecondary">How can we help you?</Text></View>
      </View>
      <ScrollView className="bg-background px-5" contentContainerClassName="pb-12 pt-5">
        <View className="rounded-2xl bg-primary p-5">
          <CircleHelp size={28} color="white" />
          <Text className="mt-4 text-lg font-bold text-white">Wefyx Support Centre</Text>
          <Text className="mt-2 text-sm leading-6 text-white/75">Request any product, service, rental, project or custom business requirement and track its progress.</Text>
        </View>
        <Text className="mb-3 mt-6 text-base font-bold text-textPrimary">Quick help</Text>
        {topics.map(([Icon, title, detail, route]: any) => (
          <Pressable key={title} onPress={() => route === 'BookSupport' ? navigation.navigate(route) : navigation.navigate('Main', { screen: route })} className="mb-3 flex-row items-center rounded-2xl border border-border bg-white p-4">
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-inputBg"><Icon size={20} color="#008553" /></View>
            <View className="ml-3 flex-1"><Text className="text-sm font-semibold text-textPrimary">{title}</Text><Text className="mt-1 text-xs leading-5 text-textSecondary">{detail}</Text></View>
            <ChevronRight size={18} color="#8A9F93" />
          </Pressable>
        ))}
        <Pressable onPress={() => navigation.navigate('BookSupport')} className="mb-4 mt-4 h-14 flex-row items-center justify-center rounded-2xl bg-primary px-5">
          <Headphones size={19} color="white" />
          <Text className="ml-3 text-sm font-semibold text-white">Submit a Requirement</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Profile({ onLogout }: { onLogout: () => void }) {
  const [user, setUser] = useState<User | null>(null),
    [session, setSession] = useState<{ name: string; email: string; role: string } | null>(null),
    [profileImage, setProfileImage] = useState<string | null>(null),
    [deviceName, setDeviceName] = useState(DeviceInfo.getModel()),
    [activity, setActivity] = useState<ResourceRecord[]>([]),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    DeviceInfo.getDeviceName().then(setDeviceName).catch(() => {});
    AsyncStorage.getItem('wefyx-profile-image').then(setProfileImage);
    AsyncStorage.getItem('wefyx-user').then(value => {
      const saved = value ? JSON.parse(value) : null;
      setSession(saved);
      setUser(saved);
      apiGet<any[]>('/notifications')
        .then(notes => setActivity(notes.slice(0, 5).map(note => ({...note, name: note.title, details: note.message}))))
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, []);
  async function chooseProfileImage() {
    const result = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1, quality: 0.8 });
    const uri = result.assets?.[0]?.uri;
    if (uri) {
      setProfileImage(uri);
      await AsyncStorage.setItem('wefyx-profile-image', uri);
    }
  }
  const admin = user || {
    id: 0,
    name: session?.name || 'Wefyx User',
    email: session?.email || '',
    role: session?.role || 'User',
    organization: '',
    location: '',
    status: 'ACTIVE',
    joinedOn: '',
  };
  const initials = admin.name.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView className="bg-background" contentContainerClassName="pb-28">
        <TabHero title="My Profile" subtitle="Account, security and recent activity" />
        <View className="px-5 pt-5">
        <View className="items-center rounded-3xl border border-border bg-white p-5 shadow-sm">
          <Pressable
            onPress={chooseProfileImage}
            className="relative h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-blue-50 shadow-sm"
          >
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                className="h-full w-full"
                resizeMode="cover"
              />
            ) : (
              <Text className="text-2xl font-bold text-primary">{initials}</Text>
            )}
          </Pressable>
          <Text className="mt-4 text-lg font-bold text-ink">{admin.name}</Text>
          <Text className="mt-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-primary">{admin.role}</Text>
          {!!admin.organization && <Text className="mt-2 text-sm text-slate-500">{admin.organization}</Text>}
        </View>
        <Text className="mb-2 mt-5 text-base font-bold text-textPrimary">Account information</Text>
        <View className="mt-4 rounded-2xl border border-border bg-white px-4">
          {[
            [Mail, admin.email],
            ...(admin.location ? [[MapPin, admin.location]] : []),
            [ShieldCheck, admin.status || 'ACTIVE'],
            [KeyRound, admin.role],
          ].filter(([, value]) => Boolean(value)).map(([Icon, value]: any) => (
            <View
              key={value}
              className="flex-row items-center border-b border-slate-100 py-4"
            >
              <Icon size={18} color={purple} />
              <Text className="ml-3 flex-1 text-sm font-medium text-ink">{value}</Text>
            </View>
          ))}
        </View>
        <View className="mt-4 flex-row gap-3">
          <View className="flex-1 rounded-2xl border border-border bg-white p-4">
            <Text className="text-lg font-bold text-emerald-600">{admin.status || 'ACTIVE'}</Text>
            <Text className="mt-1 text-xs font-medium text-slate-500">Account status</Text>
          </View>
          <View className="flex-1 rounded-2xl border border-border bg-white p-4">
            <Text className="text-lg font-bold text-blue-600">{activity.length}</Text>
            <Text className="mt-1 text-xs font-medium text-slate-500">Recent activities</Text>
          </View>
        </View>
        <View className="mt-4 rounded-2xl border border-border bg-white p-4">
          <Text className="text-base font-bold text-ink">This device</Text>
          <View className="mt-3 flex-row items-center">
            <Phone size={19} color={purple} />
            <View className="ml-3 flex-1">
              <Text className="text-sm font-semibold text-ink">{deviceName}</Text>
              <Text className="mt-1 text-xs text-slate-500">
                {DeviceInfo.getSystemName()} {DeviceInfo.getSystemVersion()} · Wefyx {DeviceInfo.getVersion()}
              </Text>
            </View>
          </View>
        </View>
        <View className="mt-4 rounded-2xl border border-border bg-white p-4">
          <Text className="text-base font-bold text-ink">Recent account activity</Text>
          {activity.map(item => (
            <View key={item.id} className="flex-row items-center border-b border-slate-100 py-3">
              <CheckCircle2 size={17} color="#008553" />
              <View className="ml-3 flex-1"><Text className="text-sm font-semibold text-ink">{item.name}</Text><Text className="mt-1 text-xs leading-5 text-slate-500">{item.details || item.status} · {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</Text></View>
            </View>
          ))}
          {!loading && activity.length === 0 && <Text className="py-5 text-center text-xs text-slate-500">No recent account activity.</Text>}
        </View>
        <Pressable
          onPress={onLogout}
          className="mt-5 flex-row items-center justify-center rounded-xl border border-red-200 bg-white py-4"
        >
          <LogOut size={18} color="#EF4444" />
          <Text className="ml-2 font-bold text-red-500">Sign out</Text>
        </Pressable>
        </View>
      </ScrollView>
      {loading && <CenteredPageLoader />}
    </SafeAreaView>
  );
}

function MainTabs({ onLogout }: { onLogout: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: purple,
        tabBarInactiveTintColor: '#8A9F93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#DCE6E0',
          elevation: 8,
          height: 64 + insets.bottom,
          paddingTop: 7,
          paddingBottom: insets.bottom + 6,
        },
        tabBarLabelStyle: {
          fontFamily: 'Poppins-Medium',
          fontSize: 10,
          marginTop: 1,
        },
        tabBarItemStyle: { height: 55 },
        tabBarIcon: ({ color, focused }) => {
          const Icon =
            route.name === 'Home'
              ? Home
              : route.name === 'Tickets'
              ? TicketIcon
              : route.name === 'Assets'
              ? Box
              : route.name === 'Shop'
              ? ShoppingCart
              : CircleUserRound;
          return (
            <View
              style={{
                width: 38,
                height: 32,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? '#EFFAF5' : 'transparent',
              }}
            >
              <Icon
                color={focused ? purple : color}
                fill="none"
                size={focused ? 23 : 22}
                strokeWidth={focused ? 2.35 : 1.9}
              />
            </View>
          );
        },
      })}
    >
      <Tabs.Screen name="Home" component={CustomerHome} />
      <Tabs.Screen name="Tickets" component={TicketsScreen} />
      <Tabs.Screen name="Assets" component={Assets} />
      <Tabs.Screen name="Shop" component={CatalogScreen} />
      <Tabs.Screen name="Profile">
        {() => <Profile onLogout={onLogout} />}
      </Tabs.Screen>
    </Tabs.Navigator>
  );
}

export default function App() {
  const [ready, setReady] = useState(false),
    [authenticated, setAuthenticated] = useState(false);
  useEffect(() => {
    setUnauthorizedHandler(() => setAuthenticated(false));
    let active = true;
    Promise.all([
      getSessionToken().catch(() => null),
      new Promise<void>(resolve => setTimeout(resolve, 1800)),
    ]).then(([token]) => {
      if (!active) return;
      setAuthenticated(Boolean(token));
      setReady(true);
    });
    return () => {
      active = false;
      setUnauthorizedHandler();
    };
  }, []);
  useEffect(() => {
    if (!ready || !authenticated) return;
    let active = true;
    async function requestAppPermissions() {
      try {
        const currentLocation = await checkLocationPermission();
        const location = ['granted', 'limited'].includes(currentLocation)
          ? currentLocation
          : await requestLocationPermission();
        const notifications = await requestNotificationPermission();
        if (active && location === 'blocked') {
          Alert.alert(
            'Location permission required',
            'Enable location access in Android settings to use live technician tracking.',
            [
              { text: 'Later', style: 'cancel' },
              { text: 'Open settings', onPress: () => openLocationSettings() },
            ],
          );
        } else if (active && notifications === 'blocked') {
          Alert.alert(
            'Notification permission required',
            'Enable notifications in Android settings to receive ticket and service updates.',
            [
              { text: 'Later', style: 'cancel' },
              { text: 'Open settings', onPress: () => openLocationSettings() },
            ],
          );
        }
      } catch {
        // The app remains usable if the device cannot present a permission prompt.
      }
    }
    requestAppPermissions();
    return () => { active = false; };
  }, [ready, authenticated]);
  async function logout() {
    await Promise.all([
      clearSessionToken(),
      AsyncStorage.removeItem('wefyx-user'),
    ]);
    setAuthenticated(false);
  }
  return (
    <SafeAreaProvider>
      <View className="flex-1 bg-primary">
        {!ready ? (
          <Splash />
        ) : !authenticated ? (
          <Login onLogin={() => setAuthenticated(true)} />
        ) : (
          <>
            <StatusBar barStyle="dark-content" />
            <NavigationContainer>
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Main">
                  {() => <MainTabs onLogout={logout} />}
                </Stack.Screen>
                <Stack.Screen name="TicketDetails" component={TicketDetails} />
                <Stack.Screen name="BookSupport" component={BookSupport} />
                <Stack.Screen name="WebServices" component={WebServices} />
                <Stack.Screen name="TrackTechnician" component={TrackTechnician} />
                <Stack.Screen name="ContractDetails" component={ContractDetails} />
                <Stack.Screen name="Notifications" component={Notifications} />
                <Stack.Screen name="Help" component={Help} />
                <Stack.Screen name="Cart" component={CartScreen} />
                <Stack.Screen name="Orders" component={OrdersScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          </>
        )}
      </View>
    </SafeAreaProvider>
  );
}
