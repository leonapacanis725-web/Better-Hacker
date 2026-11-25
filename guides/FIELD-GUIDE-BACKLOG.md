# Field Guide Backlog

These topics are queued for future beginner-friendly Field Guides, following Google's SEO recommendations. They are outlines only; no new public guide pages are published by this file.

## 1. How to read Windows Event ID 4625 failed login reason codes
- Explain what Event ID 4625 records and where to find it in Windows Event Viewer.
- Walk through the status and substatus reason codes with beginner-friendly examples.
- Show how to correlate the event with account, source workstation, timestamp, and logon type.
- Explain common false positives and evidence limitations.

## 2. Nmap basic scan flags explained for beginners
- Explain host discovery and when to use `-sn`.
- Explain a basic TCP SYN scan with `-sS` and a connect scan with `-sT`.
- Explain service/version detection with `-sV` and operating-system detection with `-O`.
- Include safe, authorized lab examples and explain that scans should only target systems the learner owns or has permission to test.

## 3. How to spot a phishing email header step by step
- Identify From, Reply-To, Return-Path, and Received fields.
- Explain SPF, DKIM, and DMARC results in plain language.
- Compare sender display names, domains, and message-routing clues.
- Show how to document suspicious evidence without opening links or attachments.

---

Existing Field Guides such as SSH failed-login hunting and Linux file permissions are already published and are not duplicated here.
