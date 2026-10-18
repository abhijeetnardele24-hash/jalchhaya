# JalChhaya: Official Video Demo Script (150–170 Seconds)

**Project**: JalChhaya (जलछाया) — Verifiable Extreme-Heat Relief Availability Network for Pune  
**Target Category**: Best Indian Use Case ($2,000 USDC + Devcon 8 Ticket)  
**Presenter**: Abhijeet Nardele  
**Target Duration**: 2 minutes 35 seconds (155 seconds)  
**Video Resolution**: 1080p 60fps (Full HD)  
**Audio**: Crisp voiceover with clear screen transitions and visual cursor highlights.

---

### [00:00 – 00:22] Scene 1: The Pune Heatwave Crisis (The Hook)
- **Visual**: Open on the JalChhaya header and live Pune Municipal Zone Grid. Zoom briefly on Hadapsar with its 41.8°C heat spike badge and the urgent incident banner.
- **Voiceover**:
  > *"Every summer in Pune, temperatures surge past 42°C. Over 200,000 outdoor delivery partners for Swiggy and Zomato, auto-rickshaw drivers, and street hawkers risk severe heat exhaustion. While municipal water kiosks (पाणपोई) and cooling shelters exist across Pune, workers face a critical problem: they travel kilometers in blistering heat only to find dry taps, broken dispensers, or overcrowded sheds.*  
  > *Centralized civic apps fail because they are slow, prone to censorship, and fail to reflect real-time ground truth. This is JalChhaya—the verifiable heat-relief availability network built directly on Arkiv."*

---

### [00:22 – 00:55] Scene 2: Live Multilingual Pune Relief Grid & Reader Mode
- **Visual**: Demonstrate selecting "Deccan Gymkhana" and "Swargate" on the spatial zone grid. Click the language buttons: toggle to **मराठी (Marathi)** showing *"डेक्कन पीएमटी बस स्थानक पाणपोई"* and *"सुरु व खात्रीशीर"*, then toggle to **हिंदी (Hindi)**, then back to **EN**.
- **Voiceover**:
  > *"JalChhaya is built mobile-first and fully trilingual in Marathi, Hindi, and English for local gig workers on the street. In public reader mode, workers require zero wallet setup, zero gas, and zero sign-in to instantly browse nearby operational water kiosks, AC cooling centers, and ORS first-aid stations.*  
  > *Every station displays landmark addresses, amenities, and its real-time usability status, verified by cryptographic provenance."*

---

### [00:55 – 01:35] Scene 3: Reporting Ground Truth & Independent Attestation
- **Visual**: Connect test wallet `0x8Bcb…0279`. Click **"Update Status"** on the Deccan water kiosk. Select *"High Wait Time / Crowded"*, enter queue depth *"5 delivery riders"*, note *"Refilled 10 mins ago, one tap slow"*, and sign the transaction to Arkiv Tiramisu. Show the Live WebSocket Event Stream immediately flash `EntityCreated` with the new observation key. Then open the **"Confirm / Challenge"** modal to demonstrate independent peer verification.
- **Voiceover**:
  > *"When a rider visits a kiosk, they can update ground availability in seconds. Every observation is an on-chain Arkiv entity with typed numeric severity from 1 to 5.*  
  > *Notice our privacy boundary: absolutely zero personal identifiable information is ever recorded on-chain—no names, no phone numbers, and no worker tracking.*  
  > *Even better, other riders can independently attest to confirm or challenge the report. Multiple confirmations increase the facility's trust score, while disputes flag stale or inaccurate reports for immediate civic attention."*

---

### [01:35 – 02:15] Scene 4: The Judge Drawer — Arkiv On-Chain Evidence Inspector
- **Visual**: Click **"On-Chain Evidence"** on the relief card. The inspector drawer glides in. Highlight:
  1. The 32-byte immutable `entityKey`.
  2. The `$creator` address and block explorer link.
  3. The `creationBlock` and `expirationBlock` countdown.
  4. The decoded typed attributes (`str()`, `i32()`, `u64()`, `key()`).
  5. Click **"Copy Query Code"**—toast shows *"Copied!"*.
- **Voiceover**:
  > *"For Devcon judges and civic auditors, we built the Arkiv On-Chain Evidence Inspector.*  
  > *Every card links directly to its underlying Arkiv Tiramisu storage entity. You can inspect the immutable `$creator` address, the exact creation block, and most importantly: Arkiv's native automated expiration.*  
  > *Usability observations automatically expire after 2 to 4 hours. No centralized cron jobs, no stale state cluttering the ledger. And with one click, any developer can copy the exact `@arkiv-network/sdk` compound query code to verify this data independently in their own terminal."*

---

### [02:15 – 02:35] Scene 5: Censorship Resistance & The Winning Impact
- **Visual**: Show the full dashboard running against live Arkiv Tiramisu (`Chain ID: 7738577`), showcasing the open-source GitHub repository and passing test suite.
- **Voiceover**:
  > *It is 100% open source under the MIT License, tested across comprehensive unit and end-to-end suites, verified via automated WCAG accessibility audits and keyboard navigation testing, and deployed live on GitHub Pages and Arkiv Tiramisu testnet.*  
  > *Thank you, and stay cool with JalChhaya."*
