export type Locale = "en" | "hi" | "mr";

export interface TranslationDictionary {
  appName: string;
  appTagline: string;
  syntheticNotice: string;
  networkBadge: string;
  readOnlyNotice: string;
  connectWallet: string;
  disconnectWallet: string;
  walletConnected: string;
  noWalletInstalled: string;
  switchNetwork: string;
  filtersTitle: string;
  searchPlaceholder: string;
  allZones: string;
  zones: Record<string, string>;
  resourceTypes: Record<string, string>;
  statuses: Record<string, string>;
  card: {
    lastConfirmed: string;
    expiresIn: string;
    expired: string;
    creatorProvenance: string;
    ownerProvenance: string;
    independentAttestations: string;
    reportStatus: string;
    verifyOrChallenge: string;
    viewEvidence: string;
    operationalHours: string;
    address: string;
    amenities: string;
    noRecentObservation: string;
  };
  evidenceInspector: {
    title: string;
    subtitle: string;
    entityKey: string;
    creatorWallet: string;
    ownerWallet: string;
    creationBlock: string;
    expirationBlock: string;
    typedAttributes: string;
    payloadData: string;
    explorerLink: string;
    sdkQueryTitle: string;
    copyQuery: string;
    copied: string;
    close: string;
  };
  modals: {
    reportTitle: string;
    reportDescription: string;
    statusLabel: string;
    severityLabel: string;
    severityHint: string;
    waterTempLabel: string;
    queueLabel: string;
    noteLabel: string;
    publicWarning: string;
    submitReport: string;
    signing: string;
    attestTitle: string;
    attestDescription: string;
    verdictLabel: string;
    verdictConfirm: string;
    verdictChallenge: string;
    reasonLabel: string;
    submitAttestation: string;
    cancel: string;
  };
  incidents: {
    bannerTitle: string;
    urgentOutage: string;
  };
  liveEvents: {
    title: string;
    listening: string;
    justNow: string;
    newPoint: string;
    newObservation: string;
    newAttestation: string;
  };
}

export const translations: Record<Locale, TranslationDictionary> = {
  en: {
    appName: "JalChhaya",
    appTagline: "Verifiable Public Heat-Relief Availability Network",
    syntheticNotice: "HACKATHON DEMO: All facilities and reports are synthetic test records on Arkiv Tiramisu testnet.",
    networkBadge: "Arkiv Tiramisu (7738577)",
    readOnlyNotice: "Public reader mode: No wallet or sign-in needed to browse verified relief points.",
    connectWallet: "Connect Wallet to Report",
    disconnectWallet: "Disconnect",
    walletConnected: "Connected",
    noWalletInstalled: "Please install an EVM wallet (e.g. MetaMask) to publish availability reports.",
    switchNetwork: "Switch to Arkiv Tiramisu",
    filtersTitle: "Filter Pune Relief Points",
    searchPlaceholder: "Search by landmark, bus stop, or facility name…",
    allZones: "All Pune Zones",
    zones: {
      all: "All Zones",
      shivajinagar: "Shivajinagar",
      deccan: "Deccan Gymkhana",
      swargate: "Swargate",
      hadapsar: "Hadapsar",
      kothrud: "Kothrud",
      hinjawadi: "Hinjawadi IT Park",
      katraj: "Katraj",
      yerawada: "Yerawada",
    },
    resourceTypes: {
      water: "Drinking Water Kiosk",
      shade: "Shaded Shelter",
      cooling_centre: "Cooling Centre",
      first_aid_ors: "First Aid & ORS Station",
    },
    statuses: {
      available: "Confirmed Usable",
      crowded: "High Wait Time / Crowded",
      unavailable: "Out of Service / Dry",
    },
    card: {
      lastConfirmed: "Confirmed",
      expiresIn: "Evidence Expires in",
      expired: "Expired (Stale)",
      creatorProvenance: "Reported by Creator",
      ownerProvenance: "Owned by",
      independentAttestations: "Independent Confirmations",
      reportStatus: "Update Status",
      verifyOrChallenge: "Confirm / Challenge",
      viewEvidence: "On-Chain Evidence",
      operationalHours: "Hours",
      address: "Location Hint",
      amenities: "Amenities",
      noRecentObservation: "No active recent observation. Facility status is unconfirmed.",
    },
    evidenceInspector: {
      title: "Arkiv On-Chain Evidence Inspector",
      subtitle: "Verifiable state retrieved directly from Arkiv Tiramisu node via typed SDK query",
      entityKey: "Entity Key (32-byte hash)",
      creatorWallet: "Immutable Creator ($creator)",
      ownerWallet: "Current Owner ($owner)",
      creationBlock: "Creation Block",
      expirationBlock: "Expiration Block ($expiresAt)",
      typedAttributes: "Indexed Typed Attributes",
      payloadData: "Decoded JSON Payload",
      explorerLink: "View in Arkiv Block Explorer",
      sdkQueryTitle: "Exact Reproducible SDK Query",
      copyQuery: "Copy Query Code",
      copied: "Copied!",
      close: "Close Drawer",
    },
    modals: {
      reportTitle: "Publish Availability Observation",
      reportDescription: "Record current on-the-ground relief point status on Arkiv. Your report will be signed with your test wallet.",
      statusLabel: "Observed Usability Status",
      severityLabel: "Severity Level",
      severityHint: "1 = pristine & flowing, 3 = high congestion, 5 = zero water/broken dispenser",
      waterTempLabel: "Water Temperature / Condition",
      queueLabel: "Queue Depth Estimate",
      noteLabel: "Field Observation Note",
      publicWarning: "Notice: This report will be written to the public Arkiv testnet. Do NOT enter private names, phone numbers, or exact home addresses.",
      submitReport: "Sign & Publish to Arkiv",
      signing: "Publishing to Tiramisu…",
      attestTitle: "Submit Independent Attestation",
      attestDescription: "Confirm or challenge an existing availability observation. Your immutable wallet address ($creator) will be attached.",
      verdictLabel: "Your Verdict",
      verdictConfirm: "Confirm (I see this facility working as reported)",
      verdictChallenge: "Challenge (I dispute this observation)",
      reasonLabel: "Reason / Verification Note",
      submitAttestation: "Sign & Attest",
      cancel: "Cancel",
    },
    incidents: {
      bannerTitle: "Active Urgent Heat Alerts in Pune",
      urgentOutage: "Relief Outage Incident",
    },
    liveEvents: {
      title: "Live Arkiv WebSocket Stream",
      listening: "Connected to wss://rpc.tiramisu.db-chain.testnet.arkiv.network",
      justNow: "just now",
      newPoint: "New Relief Point Registered",
      newObservation: "New Usability Observation Recorded",
      newAttestation: "New Attestation Broadcasted",
    },
  },
  mr: {
    appName: "जलछाया",
    appTagline: "तीव्र उन्हाळा दिलासा केंद्र उपलब्धता नेटवर्क",
    syntheticNotice: "हॅकाथॉन प्रात्यक्षिक: सर्व सुविधा व नोंदी अर्काइव्ह तिरमिसू टेस्टनेटवरील चाचणी डेटा आहेत.",
    networkBadge: "अर्काइव्ह तिरमिसू (7738577)",
    readOnlyNotice: "सार्वजनिक वाचन मोड: दिलासा केंद्रे पाहण्यासाठी कोणत्याही वॉलेट किंवा लॉगिनची गरज नाही.",
    connectWallet: "नोंद करण्यासाठी वॉलेट जोडा",
    disconnectWallet: "डिसकनेक्ट",
    walletConnected: "जोडले आहे",
    noWalletInstalled: "नोंद करण्यासाठी कृपया मेटामास्क (EVM वॉलेट) इन्स्टॉल करा.",
    switchNetwork: "अर्काइव्ह तिरमिसू नेटवर्कवर जा",
    filtersTitle: "पुणे दिलासा केंद्रे फिल्टर करा",
    searchPlaceholder: "लँडमार्क, बस स्थानक किंवा केंद्राचे नाव शोधा…",
    allZones: "सर्व पुणे परिसर",
    zones: {
      all: "सर्व परिसर",
      shivajinagar: "शिवाजीनगर",
      deccan: "डेक्कन जिमखाना",
      swargate: "स्वारगेट",
      hadapsar: "हडपसर",
      kothrud: "कोथरूड",
      hinjawadi: "हिंजवडी आयटी पार्क",
      katraj: "कात्रज",
      yerawada: "येरवडा",
    },
    resourceTypes: {
      water: "पिण्याचे पाणी (पाणपोई)",
      shade: "सावलीचा निवारा",
      cooling_centre: "शीतलन कक्ष / केंद्र",
      first_aid_ors: "प्रथमोपचार व ओआरएस केंद्र",
    },
    statuses: {
      available: "सुरु व खात्रीशीर",
      crowded: "मोठी रांग / गर्दी",
      unavailable: "पाणी नाही / बंद",
    },
    card: {
      lastConfirmed: "शेवटची खात्री",
      expiresIn: "पुरावा समाप्त होण्यास वेळ",
      expired: "कालबाह्य (अपुष्ट)",
      creatorProvenance: "नोंदकर्ता",
      ownerProvenance: "मालक",
      independentAttestations: "स्वतंत्र पडताळण्या",
      reportStatus: "स्थिती नोंदवा",
      verifyOrChallenge: "पुष्टी / आव्हान द्या",
      viewEvidence: "ऑन-चेन पुरावा",
      operationalHours: "वेळ",
      address: "पत्ता खूण",
      amenities: "सुविधा",
      noRecentObservation: "सध्या कोणतीही ताजी नोंद नाही. स्थितीची प्रत्यक्ष पडताळणी झालेली नाही.",
    },
    evidenceInspector: {
      title: "अर्काइव्ह ऑन-चेन पुरावा तपासक",
      subtitle: "थेट अर्काइव्ह तिरमिसू नोडवरून टाईप केलेल्या SDK क्वेरीद्वारे मिळालेला पुरावा",
      entityKey: "एन्टिटी की (३२-बाइट हॅश)",
      creatorWallet: "अपरिवर्तनीय निर्माता ($creator)",
      ownerWallet: "सध्याचा मालक ($owner)",
      creationBlock: "निर्मिती ब्लॉक",
      expirationBlock: "समाप्ती ब्लॉक ($expiresAt)",
      typedAttributes: "इंडेक्स केलेले गुणधर्म (Attributes)",
      payloadData: "डिकोड केलेला JSON पेलोड",
      explorerLink: "अर्काइव्ह ब्लॉक एक्सप्लोररमध्ये पहा",
      sdkQueryTitle: "थेट चालवता येणारी अचूक SDK क्वेरी",
      copyQuery: "क्वेरी कॉपी करा",
      copied: "कॉपी केले!",
      close: "बंद करा",
    },
    modals: {
      reportTitle: "उपलब्धतेची ताजी नोंद करा",
      reportDescription: "प्रत्यक्ष केंद्राची चालू स्थिती अर्काइव्हवर कायमस्वरूपी नोंदवा. आपल्या टेस्ट वॉलेटद्वारे स्वाक्षरी केली जाईल.",
      statusLabel: "चालू स्थिती",
      severityLabel: "तीव्रता स्तर",
      severityHint: "१ = थंड व सुरळीत पाणी, ३ = गर्दी, ५ = नळाला पाणी नाही / बंद",
      waterTempLabel: "पाण्याचे तापमान / स्थिती",
      queueLabel: "अंदाजे रांग",
      noteLabel: "प्रत्यक्ष पाहणी नोंद",
      publicWarning: "सूचना: ही नोंद सार्वजनिक टेस्टनेटवर जाईल. वैयक्तिक नाव, मोबाईल नंबर किंवा खाजगी माहिती टाकू नका.",
      submitReport: "स्वाक्षरी करा व पाठवा",
      signing: "तिरमिसूवर नोंद होत आहे…",
      attestTitle: "स्वतंत्र पडताळणी नोंदवा",
      attestDescription: "इतर वापरकर्त्याच्या नोंदीची पुष्टी करा किंवा आव्हान द्या. आपला वॉलेट पत्ता ($creator) जोडला जाईल.",
      verdictLabel: "तुमचा निर्णय",
      verdictConfirm: "पुष्टी (मी स्वतः ही सुविधा सुरु पाहिली)",
      verdictChallenge: "आव्हान (माहिती चुकीची किंवा बंद आहे)",
      reasonLabel: "कारण / टिप्पणी",
      submitAttestation: "स्वाक्षरी व पडताळणी",
      cancel: "रद्द करा",
    },
    incidents: {
      bannerTitle: "पुण्यातील तातडीच्या उन्हाळा समस्या",
      urgentOutage: "दिलासा केंद्र बंद पडल्याची समस्या",
    },
    liveEvents: {
      title: "थेट अर्काइव्ह वेबसॉकेट प्रवाह",
      listening: "wss://rpc.tiramisu.db-chain.testnet.arkiv.network शी जोडलेले आहे",
      justNow: "आत्ताच",
      newPoint: "नवीन दिलासा केंद्र जोडले",
      newObservation: "नवीन उपलब्धता नोंद आली",
      newAttestation: "नवीन स्वतंत्र पडताळणी झाली",
    },
  },
  hi: {
    appName: "जलछाया",
    appTagline: "सत्यापित सार्वजनिक ग्रीष्मकालीन राहत नेटवर्क",
    syntheticNotice: "हैकाथॉन डेमो: सभी सुविधाएं और रिपोर्ट आर्काइव तिरमिसू टेस्टनेट पर सिंथेटिक परीक्षण रिकॉर्ड हैं।",
    networkBadge: "आर्काइव तिरमिसू (7738577)",
    readOnlyNotice: "सार्वजनिक पाठक मोड: राहत बिंदु देखने के लिए वॉलेट या लॉगिन की कोई आवश्यकता नहीं है।",
    connectWallet: "रिपोर्ट करने के लिए वॉलेट जोड़ें",
    disconnectWallet: "डिस्कनेक्ट करें",
    walletConnected: "जुड़ा हुआ है",
    noWalletInstalled: "रिपोर्ट प्रकाशित करने के लिए कृपया एक EVM वॉलेट (जैसे मेटामास्क) स्थापित करें।",
    switchNetwork: "आर्काइव तिरमिसू नेटवर्क पर जाएं",
    filtersTitle: "पुणे राहत बिंदु फ़िल्टर करें",
    searchPlaceholder: "लैंडमार्क, बस स्टॉप या सुविधा नाम से खोजें…",
    allZones: "सभी पुणे क्षेत्र",
    zones: {
      all: "सभी क्षेत्र",
      shivajinagar: "शिवाजीनगर",
      deccan: "डेक्कन जिमखाना",
      swargate: "स्वारगेट",
      hadapsar: "हड़पसर",
      kothrud: "कोथरुड",
      hinjawadi: "हिंजवड़ी आईटी पार्क",
      katraj: "कातरज",
      yerawada: "यरवड़ा",
    },
    resourceTypes: {
      water: "पीने का पानी (प्याऊ)",
      shade: "छायादार आश्रय",
      cooling_centre: "शीतलन केंद्र",
      first_aid_ors: "प्राथमिक चिकित्सा एवं ओआरएस",
    },
    statuses: {
      available: "सत्यापित एवं चालू",
      crowded: "लंबी कतार / भारी भीड़",
      unavailable: "पानी नहीं / बंद",
    },
    card: {
      lastConfirmed: "अंतिम पुष्टि",
      expiresIn: "सबूत समाप्ति समय",
      expired: "समाप्त (अपुष्ट)",
      creatorProvenance: "रिपोर्टर",
      ownerProvenance: "मालिक",
      independentAttestations: "स्वतंत्र सत्यापन",
      reportStatus: "स्थिति अपडेट करें",
      verifyOrChallenge: "पुष्टि / चुनौती दें",
      viewEvidence: "ऑन-चेन सबूत",
      operationalHours: "समय",
      address: "स्थान संकेत",
      amenities: "सुविधाएं",
      noRecentObservation: "कोई हालिया रिपोर्ट उपलब्ध नहीं है। स्थिति सत्यापित नहीं है।",
    },
    evidenceInspector: {
      title: "आर्काइव ऑन-चेन साक्ष्य निरीक्षक",
      subtitle: "आर्काइव तिरमिसू नोड से सीधे टाइप किए गए SDK क्वेरी के माध्यम से प्राप्त साक्ष्य",
      entityKey: "एंटिटी कुंजी (32-बाइट हैश)",
      creatorWallet: "अपरिवर्तनीय निर्माता ($creator)",
      ownerWallet: "वर्तमान मालिक ($owner)",
      creationBlock: "निर्माण ब्लॉक",
      expirationBlock: "समाप्ति ब्लॉक ($expiresAt)",
      typedAttributes: "इंडेक्स किए गए एट्रिब्यूट्स",
      payloadData: "डिकोड किया गया JSON पेलोड",
      explorerLink: "आर्काइव ब्लॉक एक्सप्लोरर में देखें",
      sdkQueryTitle: "सटीक निष्पादन योग्य SDK क्वेरी",
      copyQuery: "क्वेरी कॉपी करें",
      copied: "कॉपी किया गया!",
      close: "बंद करें",
    },
    modals: {
      reportTitle: "उपलब्धता की ताज़ा रिपोर्ट दर्ज करें",
      reportDescription: "राहत बिंदु की वर्तमान स्थिति आर्काइव पर दर्ज करें। आपके परीक्षण वॉलेट से हस्ताक्षर किए जाएंगे।",
      statusLabel: "अवलोकित स्थिति",
      severityLabel: "गंभीरता स्तर",
      severityHint: "1 = सामान्य व ठंडा पानी, 3 = भारी भीड़, 5 = पानी नहीं / नल खराब",
      waterTempLabel: "पानी का तापमान / स्थिति",
      queueLabel: "अनुमानित कतार",
      noteLabel: "फील्ड अवलोकन टिप्पणी",
      publicWarning: "सूचना: यह रिपोर्ट सार्वजनिक टेस्टनेट पर जाएगी। व्यक्तिगत नाम, फोन नंबर या पता न डालें।",
      submitReport: "हस्ताक्षर करें और प्रकाशित करें",
      signing: "तिरमिसू पर भेजा जा रहा है…",
      attestTitle: "स्वतंत्र सत्यापन दर्ज करें",
      attestDescription: "अवलोकन की पुष्टि या चुनौती दें। आपका अपरिवर्तनीय वॉलेट पता ($creator) दर्ज होगा।",
      verdictLabel: "आपका निर्णय",
      verdictConfirm: "पुष्टि (मैंने खुद इसे चालू देखा)",
      verdictChallenge: "चुनौती (यह रिपोर्ट गलत या बंद है)",
      reasonLabel: "कारण / सत्यापन टिप्पणी",
      submitAttestation: "हस्ताक्षर एवं सत्यापन",
      cancel: "रद्द करें",
    },
    incidents: {
      bannerTitle: "पुणे में सक्रिय आपातकालीन गर्मी अलर्ट",
      urgentOutage: "राहत विफलता घटना",
    },
    liveEvents: {
      title: "लाइव आर्काइव वेबसॉकेट प्रवाह",
      listening: "wss://rpc.tiramisu.db-chain.testnet.arkiv.network से जुड़ा है",
      justNow: "अभी-अभी",
      newPoint: "नया राहत बिंदु पंजीकृत हुआ",
      newObservation: "नई उपलब्धता अवलोकन रिपोर्ट प्राप्त हुई",
      newAttestation: "नया स्वतंत्र सत्यापन प्रसारित हुआ",
    },
  },
};
