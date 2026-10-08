import React, { useEffect, useRef, useState } from "react";
import Registration from './src/Registration';
import {
  Animated,
  Alert,
  FlatList,
  Image,
  LogBox,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNetInfo } from "@react-native-community/netinfo";
import DeviceInfo from "react-native-device-info";
import { launchImageLibrary } from "react-native-image-picker";
import {
  Bell,
  Box,
  CalendarDays,
  Camera,
  ChevronRight,
  ClipboardList,
  Home,
  LogOut,
  PackagePlus,
  Search,
  Smartphone,
  UserRound,
  Wifi,
  WifiOff,
  X,
} from "lucide-react-native";
import {
  apiGet,
  apiLogin,
  apiRequestLoginOtp,
  apiSend,
  apiVerifyPhoneLogin,
  clearSessionToken,
  getSessionToken,
  saveSessionToken,
  setUnauthorizedHandler,
} from "./src/api";
const purple = "#008553",
  navy = "#073B2E";
LogBox.ignoreAllLogs(true);
type Tab = "Home" | "Tickets" | "Schedule" | "Profile";
type User = { name: string; email: string; role: string };
function WefyxLoader({size=54,light=false}:{size?:number;light?:boolean}){
  const rotation=useRef(new Animated.Value(0)).current;
  useEffect(()=>{
    const animation=Animated.loop(Animated.timing(rotation,{toValue:1,duration:900,useNativeDriver:true}));
    animation.start();
    return()=>animation.stop();
  },[rotation]);
  const spin=rotation.interpolate({inputRange:[0,1],outputRange:["0deg","360deg"]});
  return <Animated.View style={[s.wefyxLoader,{width:size,height:size,borderRadius:size/2,transform:[{rotate:spin}]},light&&s.wefyxLoaderLight]}>
    <Text style={[s.wefyxLoaderText,{fontSize:size*.42},light&&s.wefyxLoaderTextLight]}>W</Text>
  </Animated.View>;
}
type Item = {
  id: number;
  name: string;
  owner: string;
  details: string;
  status: string;
  quotationRequested?: boolean;
  estimatedAmount?: number;
  vendorName?: string;
  quotationStatus?: string;
};
const money = (n: number) => `AED ${n.toLocaleString()}`;
function Header({ title, onBell }: { title: string; onBell: () => void }) {
  return (
    <View style={s.header}>
      <View style={s.headBrand}>
        <View style={s.logo}>
          <Text style={s.logoT}>W</Text>
        </View>
        <View>
          <Text style={s.headTitle}>{title}</Text>
          <Text style={s.headSub}>Wefyx Technologies</Text>
        </View>
      </View>
      <Pressable style={s.iconBtn} onPress={onBell}>
        <Bell color="white" size={21} />
        <View style={s.badge}>
          <Text style={s.badgeT}>3</Text>
        </View>
      </Pressable>
    </View>
  );
}
function Status({ value }: { value: string }) {
  let k = value.toLowerCase(),
    c =
      k.includes("deliver") || k.includes("active")
        ? "#008553"
        : k.includes("ship")
        ? "#008553"
        : k.includes("cancel")
        ? "#DC2626"
        : "#D97706";
  return (
    <View style={[s.pill, { backgroundColor: `${c}18` }]}>
      <Text style={[s.pillT, { color: c }]}>{value || "Pending"}</Text>
    </View>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <View style={s.empty}>
      <Box color="#8A9F93" size={36} />
      <Text style={s.emptyTitle}>{text}</Text>
      <Text style={s.muted}>New records will appear here automatically.</Text>
    </View>
  );
}
function Ticket({ item, onPress }: { item: Item; onPress?: () => void }) {
  return (
    <Pressable style={s.card} onPress={onPress}>
      <View style={s.row}>
        <View>
          <Text style={s.ref}>#{item.name}</Text>
          <Text style={s.cardTitle}>{item.owner || "Wefyx customer"}</Text>
        </View>
        <Status value={item.status} />
      </View>
      <Text style={s.muted} numberOfLines={2}>
        {item.details || "Ticket information"}
      </Text>
      <View style={s.cardFoot}>
        <Text style={s.amount}>{money(5200)}</Text>
        <ChevronRight size={20} color="#99A4B4" />
      </View>
    </Pressable>
  );
}
function HomePage({
  tickets,
  products,
  toTickets,
}: {
  tickets: Item[];
  products: Item[];
  toTickets: () => void;
}) {
  let delivered = tickets.filter((x) =>
    x.status?.toLowerCase().includes("deliver")
  ).length;
  return (
    <ScrollView contentContainerStyle={s.content}>
      <Text style={s.eyebrow}>EMPLOYEE DASHBOARD</Text>
      <Text style={s.hero}>Good morning, Employee</Text>
      <Text style={s.muted}>
        Here is your assigned work for today.
      </Text>
      <View style={s.grid}>
        {[
          ["Assigned", tickets.length, purple],
          ["Pending", tickets.length - delivered, "#F59E0B"],
          ["Completed", delivered, "#00A86B"],
          ["Schedule", products.length, "#00A86B"],
        ].map(([a, b, c]) => (
          <View
            style={[s.stat, { borderTopColor: c as string }]}
            key={a as string}
          >
            <Text style={s.muted}>{a}</Text>
            <Text style={s.statV}>{b}</Text>
          </View>
        ))}
      </View>
      <View style={s.revenue}>
        <Text style={s.revenueL}>SERVICE PERFORMANCE</Text>
        <Text style={s.revenueV}>98% SLA</Text>
        <Text style={s.revenueUp}>↑ 6% improvement this month</Text>
      </View>
      <View style={s.sectionHead}>
        <Text style={s.section}>My tickets</Text>
        <Pressable onPress={toTickets}>
          <Text style={s.link}>View all</Text>
        </Pressable>
      </View>
      {tickets.slice(0, 3).map((x) => (
        <Ticket item={x} key={x.id} />
      ))}
      {!tickets.length && <Empty text="No assigned tickets" />}
      <Text style={[s.section, { marginTop: 20 }]}>Service snapshot</Text>
      <View style={s.snapshot}>
        {[
          ["96%", "SLA met"],
          ["4.8", "Resolved"],
          ["18h", "Response"],
        ].map(([a, b]) => (
          <View style={s.snap} key={b}>
            <Text style={s.snapV}>{a}</Text>
            <Text style={s.muted}>{b}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
function TicketsPage({
  items,
  reload,
  initialId,
  onOpened,
}: {
  items: Item[];
  initialId?: number;
  onOpened?: () => void;
  reload: () => Promise<void>;
}) {
  let [q, setQ] = useState(""),
    [selected, setSelected] = useState<Item>(),
    [vendorOptions, setVendorOptions] = useState<any[]>([]),
    [selectedVendorIds, setSelectedVendorIds] = useState<number[]>([]),
    [quotes, setQuotes] = useState<any[]>([]),
    [messages, setMessages] = useState<any[]>([]),
    [message, setMessage] = useState(""),
    [notes, setNotes] = useState(""),
    [busy, setBusy] = useState(false),
    [amount, setAmount] = useState(""),
    [days, setDays] = useState("");
  useEffect(() => {
    const item = items.find(row => row.id === initialId);
    if (item) { openRequirement(item); onOpened?.(); }
  }, [initialId, items, onOpened]);
  let list = items.filter((x) =>
    `${x.name}${x.owner}${x.status}`.toLowerCase().includes(q.toLowerCase())
  );
  async function openRequirement(item: Item) {
    setSelected(item); setSelectedVendorIds([]); setNotes(""); setMessage(""); setAmount(""); setDays("");
    const [quoteRows,chatRows,vendors] = await Promise.all([apiGet<any[]>(`/requirements/${item.id}/quotations`).catch(()=>[]),apiGet<any[]>(`/requirements/${item.id}/messages`).catch(()=>[]),apiGet<any[]>(`/users?role=VENDOR&status=ACTIVE`).catch(()=>[])]);
    setQuotes(quoteRows); setMessages(chatRows); setVendorOptions(vendors);
  }
  useEffect(() => {
    if (!selected) return;
    let active = true;
    const timer = setInterval(() => {
      apiGet<any[]>(`/requirements/${selected.id}/messages`).then(rows => { if (active) setMessages(rows); }).catch(() => {});
    }, 3000);
    return () => { active = false; clearInterval(timer); };
  }, [selected?.id]);
  async function run(work: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try { await work(); }
    catch (error) { Alert.alert("Unable to update requirement", error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }
  async function sendChat() {
    if (!selected || !message.trim()) return;
    await run(async () => {
      await apiSend(`/requirements/${selected.id}/messages`, "POST", {message: message.trim()});
      setMessage("");
      setMessages(await apiGet<any[]>(`/requirements/${selected.id}/messages`));
    });
  }
  async function reviewQuote(quote: any, action: string) {
    if (!selected) return;
    if (action !== "APPROVE" && !notes.trim()) { Alert.alert("Review notes required", "Enter a reason or revision instructions."); return; }
    await run(async () => {
      await apiSend(`/requirements/${selected.id}/quotations/${quote.id}/review`, "PATCH", {action, notes});
      setQuotes(await apiGet<any[]>(`/requirements/${selected.id}/quotations`));
      await reload();
    });
  }
  async function directQuote() {
    if (!selected) return;
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0 || !Number.isInteger(Number(days)) || Number(days) <= 0 || !notes.trim()) {
      Alert.alert("Quotation details required", "Enter a positive amount, whole delivery days, and scope or terms."); return;
    }
    await run(async () => {
      await apiSend(`/requirements/${selected.id}/quotations/employee`, "POST", {amount, leadTimeDays: days, notes});
      setQuotes(await apiGet<any[]>(`/requirements/${selected.id}/quotations`));
      await reload();
    });
  }
  async function update(action: "accept" | "decline" | "review" | "invite" | "share" | "paid") {
    if (!selected) return;
    if (action === "decline" && !notes.trim()) { Alert.alert("Reason required", "Enter the reason for declining."); return; }
    if (action === "invite" && !selectedVendorIds.length) { Alert.alert("Vendors required", "Select one or more registered vendors."); return; }
    await run(async () => {
      const path = action === "invite" || action === "share" ? `quotations/${action}` : action;
      await apiSend(`/requirements/${selected.id}/${path}`, action === "invite" ? "POST" : "PATCH", action === "invite" ? {vendorIds: selectedVendorIds} : {notes});
      setSelected(undefined); setNotes(""); setQuotes([]);
      await reload();
    });
  }
  return (
    <View style={{ flex: 1 }}>
      <View style={s.search}>
        <Search size={19} color="#8290A5" />
        <TextInput
          style={s.searchInput}
          placeholder="Search tickets..."
          value={q}
          onChangeText={setQ}
        />
      </View>
      <FlatList
        contentContainerStyle={s.list}
        data={list}
        keyExtractor={(x) => String(x.id)}
        renderItem={({ item }) => (
          <Ticket item={item} onPress={() => openRequirement(item)} />
        )}
        ListEmptyComponent={<Empty text="No matching tickets" />}
        onRefresh={reload}
        refreshing={false}
      />
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(undefined)}>
        <View style={s.shade}>
          <ScrollView style={[s.sheet, {maxHeight: "90%"}]} keyboardShouldPersistTaps="handled">
            <View style={s.sectionHead}>
            <Text style={s.sheetTitle}>Requirement review</Text>
              <Pressable onPress={() => setSelected(undefined)}>
                <X color={navy} />
              </Pressable>
            </View>
            <Text style={s.ref}>#{selected?.name}</Text>
            <Text style={s.heroSmall}>{selected?.owner}</Text>
            <Text style={s.detail}>{selected?.details}</Text>
            <TextInput style={s.input} value={notes} onChangeText={setNotes} placeholder="Add analysis and instructions for vendor" multiline />
            {selected?.quotationRequested && <><Text style={s.label}>Select vendors</Text>{vendorOptions.map(v=><Pressable key={v.id} style={[s.card,selectedVendorIds.includes(v.id)&&{borderColor:purple,borderWidth:2}]} onPress={()=>setSelectedVendorIds(ids=>ids.includes(v.id)?ids.filter(id=>id!==v.id):[...ids,v.id])}><Text style={s.heroSmall}>{v.name}</Text><Text style={s.detail}>{v.organization} · {selectedVendorIds.includes(v.id)?"Selected":"Tap to select"}</Text></Pressable>)}</>}
            {quotes.map(q => <View key={q.id} style={s.card}>
              <Text style={s.heroSmall}>{q.vendorName} - AED {q.amount || "Awaiting quote"}</Text>
              <Text style={s.detail}>{q.leadTimeDays || "-"} days - {q.status}</Text>
              {!!q.notes && <Text style={s.detail}>{q.notes}</Text>}
              {!!q.reviewNotes && <Text style={s.detail}>Review: {q.reviewNotes}</Text>}
              {["SUBMITTED", "UNDER_REVIEW"].includes(q.status) && <View style={s.actions}>{["APPROVE", "REQUEST_REVISION", "REJECT"].map(action => <Pressable key={action} disabled={busy} style={s.outline} onPress={() => reviewQuote(q, action)}><Text style={s.outlineT}>{action.replace(/_/g, " ")}</Text></Pressable>)}</View>}
            </View>)}
            <Text style={s.label}>Support chat</Text>
            <Text style={s.detail}>Live conversation with the customer, Wefyx staff and assigned vendors.</Text>
            {messages.map(m => <View key={m.id} style={s.card}><Text style={s.ref}>{m.senderName} ? {m.senderRole}</Text><Text style={s.detail}>{m.message}</Text></View>)}
            <TextInput style={s.input} value={message} onChangeText={setMessage} placeholder="Write a message" />
            <Pressable disabled={busy || !message.trim()} style={s.outline} onPress={sendChat}><Text style={s.outlineT}>SEND MESSAGE</Text></Pressable>
            {selected && !["SUBMITTED", "DECLINED", "REJECTED", "CLOSED"].includes(selected.status) && <>
              <Text style={s.label}>Direct quotation</Text>
              <TextInput style={s.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="Amount (AED)" />
              <TextInput style={s.input} value={days} onChangeText={setDays} keyboardType="number-pad" placeholder="Delivery days" />
              <Pressable disabled={busy} style={s.outline} onPress={directQuote}><Text style={s.outlineT}>SEND DIRECT QUOTATION</Text></Pressable>
            </>}
            <Text style={s.label}>Workflow action</Text>
            <View style={s.actions}>
              {selected?.status === "SUBMITTED" && <><Pressable disabled={busy} style={s.outline} onPress={() => update("accept")}><Text style={s.outlineT}>ACCEPT REQUEST</Text></Pressable><Pressable disabled={busy} style={s.outline} onPress={() => update("decline")}><Text style={s.outlineT}>RETURN / DECLINE</Text></Pressable></>}
              {selected?.status === "ACCEPTED" && <Pressable disabled={busy} style={s.outline} onPress={() => update("review")}><Text style={s.outlineT}>MARK REVIEWED</Text></Pressable>}
              <Pressable disabled={busy} style={s.outline} onPress={() => update("invite")}><Text style={s.outlineT}>INVITE VENDORS</Text></Pressable>
              {quotes.some(q => q.status === "SUBMITTED") && <Pressable disabled={busy} style={s.outline} onPress={() => update("share")}><Text style={s.outlineT}>SHARE QUOTES WITH CUSTOMER</Text></Pressable>}
              {selected?.quotationStatus === "VENDOR_ACCEPTED" && <Pressable disabled={busy} style={s.outline} onPress={() => update("paid")}><Text style={s.outlineT}>MARK PAID</Text></Pressable>}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
function SchedulePage({
  items,
  reload,
}: {
  items: Item[];
  reload: () => Promise<void>;
}) {
  let [show, setShow] = useState(false),
    [name, setName] = useState(""),
    [price, setPrice] = useState("");
  async function add() {
    if (!name.trim()) return;
    await apiSend("/resources/employee-work-notes", "POST", {
      name,
      owner: "Wefyx Technologies",
      details: `${price || "General update"} · Employee work note`,
      status: "Active",
    });
    setShow(false);
    setName("");
    setPrice("");
    await reload();
  }
  return (
    <View style={{ flex: 1 }}>
      <View style={s.actionBar}>
        <View>
          <Text style={s.section}>Today's schedule</Text>
          <Text style={s.muted}>{items.length} scheduled visits</Text>
        </View>
        <Pressable style={s.add} onPress={() => setShow(true)}>
          <PackagePlus color="white" size={17} />
          <Text style={s.addT}>Add work note</Text>
        </Pressable>
      </View>
      <FlatList
        contentContainerStyle={s.list}
        data={items}
        keyExtractor={(x) => String(x.id)}
        renderItem={({ item }) => (
          <View style={s.product}>
            <View style={s.productIcon}>
              <Box color={purple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{item.name}</Text>
              <Text style={s.muted}>{item.details}</Text>
              <View style={[s.row, { marginTop: 9 }]}>
                <Status value={item.status} />
                <Text style={s.sku}>JOB-{String(item.id).padStart(4, "0")}</Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={<Empty text="No scheduled visits" />}
        onRefresh={reload}
        refreshing={false}
      />
      <Modal visible={show} transparent animationType="slide">
        <View style={s.shade}>
          <View style={s.sheet}>
            <View style={s.sectionHead}>
              <Text style={s.sheetTitle}>Add work note</Text>
              <Pressable onPress={() => setShow(false)}>
                <X color={navy} />
              </Pressable>
            </View>
            <Text style={s.label}>Work note</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="Dell Latitude 5530"
            />
            <Text style={s.label}>Note details</Text>
            <TextInput
              style={s.input}
              value={price}
              onChangeText={setPrice}
              placeholder="Work completed or customer update"
            />
            <Pressable style={s.primary} onPress={add}>
              <Text style={s.primaryT}>Add work note</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
function ProfilePage({ user, logout }: { user: User; logout: () => void }) {
  const [photoUri, setPhotoUri] = useState<string>();
  const network = useNetInfo();
  useEffect(() => {
    AsyncStorage.getItem("wefyx-employee-profile-photo").then((uri) => {
      if (uri) setPhotoUri(uri);
    });
  }, []);
  async function chooseProfilePhoto() {
    const result = await launchImageLibrary({
      mediaType: "photo",
      selectionLimit: 1,
      quality: 0.8,
    });
    const uri = result.assets?.[0]?.uri;
    if (!uri) return;
    await AsyncStorage.setItem("wefyx-employee-profile-photo", uri);
    setPhotoUri(uri);
  }
  const online =
    network.isConnected !== false && network.isInternetReachable !== false;
  return (
    <ScrollView contentContainerStyle={s.content}>
      <Pressable style={s.outline} onPress={() => Linking.openURL('https://wefyx.pro/portal').catch(() => Alert.alert('Unable to open website', 'Please try again.'))}><Text style={s.outlineT}>FULL WEB PORTAL</Text><Text style={s.muted}>Opens in your browser; sign in to continue.</Text></Pressable>
      <View style={s.profile}>
        <Pressable
          style={s.avatarWrap}
          onPress={chooseProfilePhoto}
          accessibilityRole="button"
          accessibilityLabel="Choose profile photo"
        >
          <View style={s.avatar}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={s.avatarImage} />
            ) : (
              <Text style={s.avatarT}>
                {user.name
                  .split(" ")
                  .map((x) => x[0])
                  .slice(0, 2)
                  .join("")}
              </Text>
            )}
          </View>
          <View style={s.cameraBadge}>
            <Camera size={14} color="white" />
          </View>
        </Pressable>
        <Text style={s.profileName}>{user.name}</Text>
        <Text style={s.link}>Verified Employee</Text>
      </View>
      <View style={s.info}>
        <Text style={s.section}>Connection & device</Text>
        <View style={s.connectionRow}>
          <View
            style={[
              s.connectionIcon,
              { backgroundColor: online ? "#E8F8F0" : "#FDECEC" },
            ]}
          >
            {online ? (
              <Wifi size={18} color="#008553" />
            ) : (
              <WifiOff size={18} color="#DC2626" />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>{online ? "Online" : "Offline"}</Text>
            <Text style={s.muted}>
              {network.type === "unknown"
                ? "Checking connection"
                : `${network.type.toUpperCase()} connection`}
            </Text>
          </View>
        </View>
        <View style={s.connectionRow}>
          <View style={s.connectionIcon}>
            <Smartphone size={18} color={purple} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>{DeviceInfo.getModel()}</Text>
            <Text style={s.muted}>
              {DeviceInfo.getSystemName()} {DeviceInfo.getSystemVersion()} · App{" "}
              {DeviceInfo.getVersion()}
            </Text>
          </View>
        </View>
      </View>
      <View style={s.info}>
        <Text style={s.section}>Employment information</Text>
        {[
          ["Company", "Wefyx Technologies"],
          ["Email", user.email],
          ["Employee ID", "VND-2026-0015"],
          ["Location", "Dubai, UAE"],
          ["Resolved", "4.8 / 5.0"],
        ].map(([a, b]) => (
          <View style={s.infoRow} key={a}>
            <Text style={s.infoL}>{a}</Text>
            <Text style={s.infoV}>{b}</Text>
          </View>
        ))}
      </View>
      <View style={s.info}>
        <Text style={s.section}>Account & support</Text>
        {[
          "Payments & settlements",
          "Team members",
          "Help & support",
          "Privacy policy",
        ].map((x) => (
          <Pressable style={s.menu} key={x}>
            <Text style={s.cardTitle}>{x}</Text>
            <ChevronRight size={19} color="#8A9F93" />
          </Pressable>
        ))}
      </View>
      <Pressable style={s.logout} onPress={logout}>
        <LogOut size={19} color="#DC2626" />
        <Text style={s.logoutT}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}
function Notices({ close, open }: { close: () => void; open: (id?: number) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');
  const load = () => apiGet<any[]>('/notifications').then(setItems).catch(e => setError(e.message));
  useEffect(() => { load(); }, []);
  async function markRead(item: any) {
    try {
      await apiSend(`/notifications/${item.id}/read`, 'PATCH');
      setItems(rows => rows.map(row => row.id === item.id ? {...row, read: true} : row));
      if (item.requirementId) open(item.requirementId);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to mark notification read.'); }
  }
  return <Modal animationType="slide" onRequestClose={close}><SafeAreaView style={s.page}>
    <View style={s.modalHead}><Pressable onPress={close}><X color={navy}/></Pressable><Text style={s.section}>Notifications</Text><Pressable onPress={load}><Text>Refresh</Text></Pressable></View>
    <ScrollView contentContainerStyle={s.content}>
      {!!error && <Text>{error}</Text>}
      {items.map(item => <Pressable style={s.notice} key={item.id} onPress={() => markRead(item)}><View style={{flex:1}}><Text style={s.cardTitle}>{item.read ? '' : '? '}{item.title}</Text><Text style={s.muted}>{item.message}</Text></View></Pressable>)}
      {!items.length && !error && <Text style={s.muted}>No notifications.</Text>}
    </ScrollView>
  </SafeAreaView></Modal>;
}

function Login({ done }: { done: (u: User) => void }) {
  let [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [registering,setRegistering]=useState(false),
    [otpPending,setOtpPending]=useState(false),
    [loginPhone,setLoginPhone]=useState(""),
    [loginOtp,setLoginOtp]=useState(""),
    [error, setError] = useState("");
  const normalizePhone=(value:string)=>{const clean=value.trim().replace(/[\s()-]/g,"");return clean.startsWith("+")?clean:`+971${clean.replace(/^0/,"")}`;};
  async function finishLogin(d:{token:string;user:User}) {
    if (d.user.role !== "EMPLOYEE") {
      throw new Error("This account is not authorized for the Employee app");
    }
    await saveSessionToken(d.token);
    await AsyncStorage.setItem("wefyx-employee-user", JSON.stringify(d.user));
    setPassword("");
    setLoginOtp("");
    setOtpPending(false);
    done(d.user);
  }
  async function submit() {
    setBusy(true);
    setError("");
    try {
      const identifier=email.trim();
      const isPhone=/^\+?\d[\d\s()-]+$/.test(identifier);
      if(isPhone){
        const sent=await apiRequestLoginOtp(normalizePhone(identifier));
        setLoginPhone(sent.phone);
        setLoginOtp("");
        setOtpPending(true);
        return;
      }
      await finishLogin(await apiLogin(identifier, password));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in");
    } finally {
      setBusy(false);
    }
  }
  async function verifyPhoneLogin() {
    setBusy(true);
    setError("");
    try {
      if(!/^[0-9]{6}$/.test(loginOtp)) throw new Error("Enter the 6-digit OTP.");
      await finishLogin(await apiVerifyPhoneLogin(loginPhone,loginOtp));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to verify OTP");
    } finally {
      setBusy(false);
    }
  }
  if(registering)return <Registration role="EMPLOYEE" onBack={()=>setRegistering(false)} onRegistered={value=>{setEmail(value);setPassword('');setRegistering(false)}}/>;
  return (
    <SafeAreaView style={s.login}>
      <StatusBar backgroundColor={navy} barStyle="light-content" />
      <View style={s.loginBrand}>
        <View style={s.loginLogo}>
          <Text style={s.loginLogoT}>W</Text>
        </View>
        <Text style={s.loginName}>Wefyx.pro</Text>
        <Text style={s.loginTag}>Employee App</Text>
      </View>
      <View style={s.loginCard}>
        <Text style={s.loginTitle}>Welcome back</Text>
        <Text style={s.loginSub}>
          Sign in to manage assigned tickets, schedules and service updates.
        </Text>
        <Text style={s.label}>Employee email or mobile</Text>
        <TextInput
          style={s.input}
          value={email}
          onChangeText={value=>{setEmail(value);setOtpPending(false);setLoginOtp("");}}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="employee@wefyx.pro or +971501234567"
        />
        {/^\+?\d[\d\s()-]+$/.test(email.trim()) ? null : <><Text style={s.label}>Password</Text>
        <TextInput
          style={s.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Enter password"
        />
        </>}
        {otpPending && <>
          <Text style={s.label}>SMS OTP</Text>
          <TextInput
            style={s.input}
            value={loginOtp}
            onChangeText={value=>setLoginOtp(value.replace(/\D/g,"").slice(0,6))}
            keyboardType="number-pad"
            placeholder="6-digit code"
          />
        </>}
        {!!error && <Text style={s.error}>{error}</Text>}
        <Pressable style={s.primary} disabled={busy} onPress={otpPending?verifyPhoneLogin:submit}>
          {busy ? (
            <WefyxLoader size={30} light />
          ) : (
            <Text style={s.primaryT}>{otpPending?"Verify OTP & Sign in":"Sign in as Employee"}</Text>
          )}
        </Pressable>
        <Pressable style={{paddingVertical:12}} onPress={() => Linking.openURL('https://wefyx.pro/forgot-password').catch(() => Alert.alert('Unable to open recovery', 'Please try again.'))}><Text style={s.link}>Forgot password? Open website</Text></Pressable>
        <View style={s.registerSection}>
          <Text style={s.registerPrompt}>Joining the Wefyx service team?</Text>
          <Pressable onPress={()=>setRegistering(true)} style={s.registerButton}>
            <Text style={s.registerButtonText}>Create employee account</Text>
          </Pressable>
          <Text style={s.approvalNote}>Administrator approval is required</Text>
        </View>
        <Text style={s.secure}>
          Secure access for Wefyx employees
        </Text>
      </View>
    </SafeAreaView>
  );
}
function EmployeeApp() {
  let [user, setUser] = useState<User>(),
    [loading, setLoading] = useState(true),
    [tab, setTab] = useState<Tab>("Home"),
    [tickets, setTickets] = useState<Item[]>([]),
    [products, setSchedule] = useState<Item[]>([]),
    [notice, setNotice] = useState(false),
    [notificationId, setNotificationId] = useState<number>(),
    [fetching, setFetching] = useState(false);
  async function logout() {
    await Promise.all([
      clearSessionToken(),
      AsyncStorage.removeItem("wefyx-employee-user"),
    ]);
    setUser(undefined);
  }
  async function reload() {
    setFetching(true);
    try {
      const raw = await apiGet<any[]>("/requirements");
      const o: Item[] = raw.map((ticket) => ({
        id: ticket.id,
        name: ticket.reference,
        owner: ticket.customerName || ticket.organization,
        details: `${ticket.title} · ${ticket.category || "Service"}${ticket.quotationRequested ? ` · Quote ${ticket.quotationStatus}${ticket.estimatedAmount ? ` · AED ${ticket.estimatedAmount}` : ""}` : ""}`,
        status: ticket.status,
        quotationRequested: ticket.quotationRequested,
        estimatedAmount: ticket.estimatedAmount,
        vendorName: ticket.vendorName,
        quotationStatus: ticket.quotationStatus,
      }));
      setTickets(o);
      setSchedule(o.slice(0, 6));
    } catch (e) {
      if (user)
        Alert.alert(
          "Unable to refresh",
          e instanceof Error ? e.message : "Try again"
        );
    } finally {
      setFetching(false);
    }
  }
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(undefined));
    let active = true;
    (async () => {
      const tokenRequest = getSessionToken().catch(() => null);
      try {
        const cachedUser = await AsyncStorage.getItem("wefyx-employee-user");
        if (!active) return;

        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
        }
        setLoading(false);

        // Secure storage can be slower than AsyncStorage on some Android
        // devices. Validate it after rendering the cached session so startup
        // is not held on the splash/loading screen.
        const token = await tokenRequest;
        if (active && cachedUser && !token) {
          await AsyncStorage.removeItem("wefyx-employee-user");
          setUser(undefined);
        }
      } catch {
        if (active) {
          setUser(undefined);
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
      setUnauthorizedHandler();
    };
  }, []);
  useEffect(() => {
    if (user) reload();
    // reload is intentionally tied to authentication changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  if (loading)
    return (
      <View style={s.center}>
        <WefyxLoader size={62} />
        <Text style={s.loadingText}>Loading your workspace</Text>
      </View>
    );
  if (!user) return <Login done={setUser} />;
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: navy }}>
      <View style={s.page}>
        <StatusBar backgroundColor={navy} barStyle="light-content" />
        <Header
          title={tab === "Home" ? "Employee Dashboard" : tab}
          onBell={() => setNotice(true)}
        />
        {fetching && <View pointerEvents="none" style={s.loadingOverlay}><WefyxLoader size={52}/></View>}
        <View style={{ flex: 1 }}>
          {tab === "Home" ? (
            <HomePage
              tickets={tickets}
              products={products}
              toTickets={() => setTab("Tickets")}
            />
          ) : tab === "Tickets" ? (
            <TicketsPage items={tickets} reload={reload} initialId={notificationId} onOpened={() => setNotificationId(undefined)} />
          ) : tab === "Schedule" ? (
            <SchedulePage items={products} reload={reload} />
          ) : (
            <ProfilePage
              user={user}
              logout={() =>
                Alert.alert("Sign out", "Are you sure?", [
                  { text: "Cancel" },
                  { text: "Sign out", style: "destructive", onPress: logout },
                ])
              }
            />
          )}
        </View>
        <View style={s.tabs}>
          {(
            [
              { name: "Home", I: Home },
              { name: "Tickets", I: ClipboardList },
              { name: "Schedule", I: CalendarDays },
              { name: "Profile", I: UserRound },
            ] as const
          ).map(({ name, I }) => (
            <Pressable style={s.tab} key={name} onPress={() => setTab(name)}>
              <I
                size={23}
                color={tab === name ? purple : "#63796C"}
                strokeWidth={tab === name ? 2.6 : 2}
              />
              <Text style={[s.tabT, tab === name && { color: purple }]}>
                {name}
              </Text>
            </Pressable>
          ))}
        </View>
        {notice && <Notices close={() => setNotice(false)} open={id => {setNotice(false); setNotificationId(id); setTab("Tickets");}} />}
      </View>
    </SafeAreaView>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <EmployeeApp />
    </SafeAreaProvider>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7FAF8" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  wefyxLoader:{alignItems:"center",justifyContent:"center",borderWidth:3,borderColor:"#B8E7CF",borderTopColor:purple,backgroundColor:"white",shadowColor:purple,shadowOpacity:.18,shadowRadius:10,elevation:5},
  wefyxLoaderLight:{borderColor:"rgba(255,255,255,.35)",borderTopColor:"white",backgroundColor:"transparent",shadowOpacity:0,elevation:0},
  wefyxLoaderText:{fontFamily:"Poppins-ExtraBold",color:navy,lineHeight:undefined,letterSpacing:-2},
  wefyxLoaderTextLight:{color:"white"},
  loadingText:{marginTop:16,fontFamily:"Poppins-Medium",fontSize:12,color:"#63796C"},
  loadingOverlay:{position:"absolute",zIndex:20,top:94,left:0,right:0,bottom:78,alignItems:"center",justifyContent:"center",backgroundColor:"rgba(248,250,252,.88)"},
  header: {
    height: 94,
    backgroundColor: navy,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headBrand: { flexDirection: "row", alignItems: "center", gap: 11 },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  logoT: { fontFamily: "Poppins-ExtraBold", fontSize: 25, color: navy, letterSpacing: -2 },
  headTitle: { fontFamily: "Poppins-SemiBold", fontSize: 18, color: "white" },
  headSub: { fontFamily: "Poppins-Regular", fontSize: 11, color: "#B8E7CF" },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#075438",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    right: 4,
    top: 4,
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: "#F04455",
    alignItems: "center",
  },
  badgeT: { fontSize: 9, color: "white" },
  content: { padding: 18, paddingBottom: 32 },
  eyebrow: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 11,
    letterSpacing: 1,
    color: purple,
  },
  hero: { fontFamily: "Poppins-Bold", fontSize: 22, color: navy, marginTop: 4 },
  heroSmall: {
    fontFamily: "Poppins-Bold",
    fontSize: 18,
    color: navy,
    marginTop: 4,
  },
  muted: {
    fontFamily: "Poppins-Regular",
    fontSize: 11,
    color: "#63796C",
    marginTop: 3,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16 },
  stat: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    borderTopWidth: 3,
    elevation: 2,
  },
  statV: {
    fontFamily: "Poppins-Bold",
    fontSize: 24,
    color: navy,
    marginTop: 4,
  },
  revenue: {
    backgroundColor: purple,
    borderRadius: 16,
    padding: 18,
    marginTop: 14,
  },
  revenueL: { fontFamily: "Poppins-Medium", fontSize: 10, color: "#DCF3E7" },
  revenueV: {
    fontFamily: "Poppins-Bold",
    fontSize: 24,
    color: "white",
    marginVertical: 3,
  },
  revenueUp: { fontFamily: "Poppins-Medium", fontSize: 10, color: "#C8F8DD" },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 10,
  },
  section: { fontFamily: "Poppins-SemiBold", fontSize: 16, color: navy },
  link: { fontFamily: "Poppins-Medium", fontSize: 11, color: purple },
  card: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#DCE6E0",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  ref: { fontFamily: "Poppins-SemiBold", fontSize: 11, color: purple },
  cardTitle: { fontFamily: "Poppins-SemiBold", fontSize: 13, color: navy },
  cardFoot: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 11,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E7EFEA",
  },
  amount: { fontFamily: "Poppins-SemiBold", fontSize: 14, color: navy },
  pill: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  pillT: { fontFamily: "Poppins-Medium", fontSize: 9 },
  snapshot: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 16,
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  snap: { alignItems: "center" },
  snapV: { fontFamily: "Poppins-Bold", fontSize: 18, color: navy },
  empty: { alignItems: "center", paddingVertical: 44 },
  emptyTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
    color: navy,
    marginTop: 8,
  },
  search: {
    height: 48,
    margin: 16,
    marginBottom: 2,
    backgroundColor: "white",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#DCE6E0",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: navy,
  },
  list: { padding: 16, paddingBottom: 26 },
  shade: { flex: 1, backgroundColor: "#073B2E70", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "white",
    padding: 22,
    paddingBottom: 34,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetTitle: { fontFamily: "Poppins-Bold", fontSize: 19, color: navy },
  detail: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    lineHeight: 20,
    color: "#52675B",
    marginVertical: 14,
  },
  label: {
    fontFamily: "Poppins-Medium",
    fontSize: 12,
    color: navy,
    marginTop: 14,
    marginBottom: 6,
  },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 7 },
  outline: {
    borderWidth: 1,
    borderColor: "#DCE6E0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  outlineT: { fontFamily: "Poppins-Medium", fontSize: 11, color: purple },
  actionBar: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  add: {
    backgroundColor: purple,
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    gap: 6,
  },
  addT: { fontFamily: "Poppins-SemiBold", fontSize: 11, color: "white" },
  product: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderColor: "#DCE6E0",
  },
  productIcon: {
    width: 54,
    height: 54,
    borderRadius: 13,
    backgroundColor: "#EFFAF5",
    alignItems: "center",
    justifyContent: "center",
  },
  sku: { fontFamily: "Poppins-Regular", fontSize: 9, color: "#8A9F93" },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#DCE6E0",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: navy,
  },
  primary: {
    height: 52,
    borderRadius: 12,
    backgroundColor: purple,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  primaryT: { fontFamily: "Poppins-SemiBold", fontSize: 14, color: "white" },
  profile: {
    backgroundColor: "white",
    borderRadius: 17,
    padding: 22,
    alignItems: "center",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#DCF3E7",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrap: { position: "relative" },
  avatarImage: { width: 72, height: 72, borderRadius: 36 },
  cameraBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: purple,
    borderWidth: 3,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarT: { fontFamily: "Poppins-Bold", fontSize: 24, color: purple },
  profileName: {
    fontFamily: "Poppins-Bold",
    fontSize: 20,
    color: navy,
    marginTop: 9,
  },
  info: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
  },
  connectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E7EFEA",
  },
  connectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#EFFAF5",
    alignItems: "center",
    justifyContent: "center",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E7EFEA",
  },
  infoL: { fontFamily: "Poppins-Regular", fontSize: 11, color: "#63796C" },
  infoV: {
    fontFamily: "Poppins-Medium",
    fontSize: 11,
    color: navy,
    maxWidth: "62%",
  },
  menu: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E7EFEA",
  },
  logout: {
    height: 52,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#F2C7CA",
    marginTop: 15,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutT: { fontFamily: "Poppins-SemiBold", fontSize: 13, color: "#DC2626" },
  modalHead: {
    height: 62,
    backgroundColor: "white",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notice: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    gap: 12,
  },
  noticeIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#EFFAF5",
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: {
    height: 82,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#DCE6E0",
    flexDirection: "row",
    paddingTop: 5,
    paddingBottom: 9,
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  tabT: { fontFamily: "Poppins-Medium", fontSize: 10, color: "#63796C" },
  login: {
    flex: 1,
    backgroundColor: navy,
    justifyContent: "center",
    padding: 22,
  },
  loginBrand: { alignItems: "center", marginBottom: 25 },
  loginLogo: {
    width: 66,
    height: 66,
    borderRadius: 19,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#B8E7CF",
    alignItems: "center",
    justifyContent: "center",
  },
  loginLogoT: { fontFamily: "Poppins-ExtraBold", fontSize: 43, color: navy, letterSpacing: -3 },
  loginName: {
    fontFamily: "Poppins-Bold",
    fontSize: 25,
    color: "white",
    marginTop: 9,
  },
  loginTag: { fontFamily: "Poppins-Regular", fontSize: 12, color: "#B8E7CF" },
  loginCard: { backgroundColor: "white", borderRadius: 23, padding: 22 },
  loginTitle: { fontFamily: "Poppins-Bold", fontSize: 23, color: navy },
  loginSub: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    lineHeight: 19,
    color: "#63796C",
    marginTop: 3,
  },
  error: {
    fontFamily: "Poppins-Regular",
    fontSize: 11,
    color: "#DC2626",
    backgroundColor: "#FEF0F0",
    padding: 10,
    borderRadius: 9,
    marginTop: 10,
  },
  secure: {
    fontFamily: "Poppins-Regular",
    fontSize: 10,
    color: "#8A9F93",
    textAlign: "center",
    marginTop: 15,
  },
  registerSection: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8E5",
    marginTop: 10,
    paddingTop: 18,
  },
  registerPrompt: {
    fontFamily: "Poppins-Medium",
    fontSize: 11,
    color: "#63796C",
    textAlign: "center",
  },
  registerButton: {
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#008553",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  registerButtonText: {
    fontFamily: "Poppins-Bold",
    fontSize: 14,
    color: "#008553",
  },
  approvalNote: {
    fontFamily: "Poppins-Regular",
    fontSize: 10,
    color: "#8A9F93",
    textAlign: "center",
    marginTop: 8,
  },
});
