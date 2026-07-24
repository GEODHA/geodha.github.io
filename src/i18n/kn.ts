// ಕನ್ನಡ strings. Machine-drafted with care — PLEASE have a native speaker
// review before wide release. Type-checked against the English Dict.

import type { Dict } from './index';

export const kn: Dict = {
  common: {
    getApp: 'ಆ್ಯಪ್ ಪಡೆಯಿರಿ',
    reportProblem: 'ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ',
    seeMap: 'ನಕ್ಷೆ ನೋಡಿ',
    submitReport: 'ವರದಿ ಸಲ್ಲಿಸಿ',
    playStore: 'Google Play ನಲ್ಲಿ ಪಡೆಯಿರಿ',
    iosApp: 'App Store ನಲ್ಲಿ ಪಡೆಯಿರಿ',
    nowAvailable: 'ಈಗ ಲಭ್ಯವಿದೆ',
  },
  nav: {
    home: 'ಮುಖಪುಟ',
    dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    data: 'ದತ್ತಾಂಶ',
    blog: 'ಬ್ಲಾಗ್',
    about: 'ನಮ್ಮ ಬಗ್ಗೆ',
    city: 'ಬೆಂಗಳೂರು',
    otherCities: 'ಇತರ ನಗರಗಳು — ನೋಂದಾಯಿಸಿ',
    language: 'ಭಾಷೆ',
  },
  footer: {
    tagline: 'ಬೆಂಗಳೂರಿನ ವಾರ್ಡ್‌ಗಳಿಗೆ ನಾಗರಿಕ ಹೊಣೆಗಾರಿಕೆ. ನಾಗರಿಕರ ಸಾಕ್ಷ್ಯ → ಸಂಸ್ಥೆಗಳ ಕ್ರಮ.',
    partners: 'ಪಾಲುದಾರರು ಮತ್ತು ಬೆಂಬಲಿಗರು',
    platform: 'ವೇದಿಕೆ',
    resources: 'ಸಂಪನ್ಮೂಲಗಳು',
    about: 'ನಮ್ಮ ಬಗ್ಗೆ',
    getInvolved: 'ಭಾಗವಹಿಸಿ',
    involvedText: 'ನಿಮ್ಮ ಸುತ್ತ ಕಸದ ಸಮಸ್ಯೆ ಕಾಣುತ್ತಿದೆಯೇ? ನಮಗೆ ತಿಳಿಸಿ ಮತ್ತು ಪರಿಹಾರಗಳ ಬಗ್ಗೆ ತಿಳಿಯಿರಿ.',
    dataAnalysis: 'ದತ್ತಾಂಶ ಮತ್ತು ವಿಶ್ಲೇಷಣೆ',
    wasteGuide: 'ಕಸ ವಿಂಗಡಣೆ ಮಾರ್ಗದರ್ಶಿ',
    bwgGuide: 'BWG ವಿಲೇವಾರಿ ಮಾರ್ಗಸೂಚಿಗಳು',
    volunteer: 'ಸ್ವಚ್ಛತಾ ಅಭಿಯಾನಕ್ಕೆ ಸ್ವಯಂಸೇವಕರಾಗಿ',
    wasteToValue: 'ಕಸದಿಂದ ಮೌಲ್ಯ ಅವಕಾಶಗಳು',
    mission: 'ನಮ್ಮ ಧ್ಯೇಯ',
    privacy: 'ಗೌಪ್ಯತಾ ನೀತಿ',
    contact: 'ಸಂಪರ್ಕಿಸಿ',
    androidApp: 'Android ಆ್ಯಪ್ — Google Play',
    iosApp: 'iOS ಆ್ಯಪ್ — App Store',
    rights: '© 2026 GEODHA. ಎಲ್ಲ ಹಕ್ಕುಗಳು ಕಾಯ್ದಿರಿಸಲಾಗಿವೆ.',
  },
  // Landing page (src/pages/Index.tsx) — full copy, section by section.
  landing: {
    bannerAvailable: 'GEODHA ವರದಿ ಆ್ಯಪ್ ಈಗ ಲಭ್ಯವಿದೆ!',
    bannerGooglePlay: 'Google Play',
    bannerAppStore: 'App Store',

    missionKicker: 'ನಮ್ಮ ಧ್ಯೇಯ',
    missionPart1: 'ಶುಚಿ,',
    missionLiveable: 'ವಾಸಯೋಗ್ಯ',
    missionPart2: 'ಮತ್ತು',
    missionSustainable: 'ಸುಸ್ಥಿರ',
    missionPart3: 'ನಗರಗಳು.',

    marquee1: 'ಕ್ರಿಯೆಗಾಗಿ ದತ್ತಾಂಶ.',
    marquee2: 'ಜಾಗೃತಿಗಾಗಿ ದತ್ತಾಂಶ.',
    marquee3: 'ಹೊಣೆಗಾರಿಕೆಗಾಗಿ ದತ್ತಾಂಶ.',

    problemTitle: 'ಸಮಸ್ಯೆ',
    problemCaption: 'ಪ್ರತಿ ಬೀದಿಯಲ್ಲೂ ಇದೆ.',
    problemCredit: 'GEODHA ವರದಿ ಆ್ಯಪ್ ಮೂಲಕ ಸಂಗ್ರಹಿಸಿದ ನೈಜ ಚಿತ್ರಗಳು',

    solutions1Kicker: 'ನಮ್ಮ ಪರಿಹಾರಗಳು · 01',
    solutions1Title: 'ವರದಿ ಆ್ಯಪ್',
    appSlide1Title: 'ತ್ವರಿತ ವರದಿ',
    appSlide1Sub: 'ಫೋಟೋ + GPS. 30 ಸೆಕೆಂಡುಗಳು.',
    appSlide2Title: 'ನೇರ ವರದಿ',
    appSlide2Sub: 'ಸರಿಯಾದ ಅಧಿಕಾರಿಗೆ ನೇರವಾಗಿ.',
    appSlide3Title: 'ಸಾರ್ವಜನಿಕ ದತ್ತಾಂಶ',
    appSlide3Sub: 'ಪ್ರತಿ ವರದಿ ಲೈವ್, ಮುಕ್ತ ನಕ್ಷೆಯಲ್ಲಿ.',
    appSlide4Title: 'ಎಸ್ಕಲೇಶನ್ ಮಾರ್ಗದರ್ಶನ',
    appSlide4Sub: 'ಪ್ರತಿಕ್ರಿಯೆ ಇಲ್ಲವೇ? ಮುಂದಿನ ಹಂತ ತೋರಿಸುತ್ತೇವೆ.',

    threadSubmittedLabel: 'ದೂರು ಸಲ್ಲಿಸಲಾಗಿದೆ',
    threadSubmittedBody: 'ID #21043536',
    threadUpdateLabel: 'ವರದಿ ನವೀಕರಣ',
    threadUpdate1Quote: 'ಕಸ ತೆರವುಗೊಳಿಸಲಾಗಿದೆ.',
    threadUpdate2Quote: 'ಈ ಪ್ರದೇಶದಲ್ಲಿ ಕಸ ಬೀಳದಂತೆ ತಡೆಯುವ ಜವಾಬ್ದಾರಿ ಆಸ್ತಿ ಮಾಲೀಕರದ್ದು.',
    threadRemarks: 'ಅಧಿಕಾರಿಗಳ ಟಿಪ್ಪಣಿ',
    threadCaption: 'ಅಧಿಕೃತ ಚಾನಲ್‌ಗಳಿಗೆ ಒಂದೇ ಟ್ಯಾಪ್‌ನಲ್ಲಿ ವರದಿ ಮಾಡಿ. ಪ್ರತಿ ವರದಿ ಮತ್ತು ಅದರ ಸ್ಥಿತಿ ಸಮುದಾಯಕ್ಕೆ ಗೋಚರಿಸುತ್ತದೆ, ನೈಜ ಪತ್ತೆಹಚ್ಚುವಿಕೆ ಮತ್ತು ಹೊಣೆಗಾರಿಕೆಗಾಗಿ.',

    statUsers: 'ಆ್ಯಪ್ ಬಳಕೆದಾರರು',
    statReports: 'ಸಲ್ಲಿಸಿದ ವರದಿಗಳು',
    statCaseStudies: 'ದಾಖಲಿತ ಕೇಸ್ ಸ್ಟಡಿಗಳು',

    solutions2Kicker: 'ನಮ್ಮ ಪರಿಹಾರಗಳು · 02',
    solutions2Title: 'ಇಡೀ ನಗರದ ಕಸ, ನಕ್ಷೆಯಲ್ಲಿ.',
    solutions2Body: 'ಪ್ರತಿ ವಾರ್ಡ್‌ನ ಕಸದ ಸ್ಥಿತಿ — ಲೈವ್, ಮುಕ್ತ ಮತ್ತು ಸಾರ್ವಜನಿಕ. ವಿವರಗಳು ಮತ್ತು ಶಿಫಾರಸು ಮಾಡಿದ ಕ್ರಮಗಳಿಗಾಗಿ ಯಾವುದೇ ವಾರ್ಡ್ ಟ್ಯಾಪ್ ಮಾಡಿ.',

    blogTitle: 'ಬ್ಲಾಗ್',
    blogBody: 'ತ್ಯಾಜ್ಯ ನಿರ್ವಹಣೆ ಮತ್ತು ವೃತ್ತಾಕಾರ ಆರ್ಥಿಕತೆಯ ಕಲ್ಪನೆಗಳು.',
    segregateTitle: 'ಸರಿಯಾಗಿ ವಿಂಗಡಿಸಿ',
    segregateBody: 'ಕಸವನ್ನು ಸರಿಯಾಗಿ ವಿಂಗಡಿಸುವುದು ಮತ್ತು ವಿಲೇವಾರಿ ಮಾಡುವುದು ಹೇಗೆಂದು ತಿಳಿಯಿರಿ.',
    volunteerTitle: 'ಸ್ವಯಂಸೇವೆ',
    volunteerBody: 'ಸ್ವಚ್ಛತಾ ಅಭಿಯಾನಗಳಲ್ಲಿ ಸೇರಿ ಮತ್ತು ಮುಂಬರುವ ಕಾರ್ಯಕ್ರಮಗಳನ್ನು ನೋಡಿ.',

    ctaTitle: 'ನಮ್ಮ ಧ್ಯೇಯದಲ್ಲಿ ಸೇರಿ',
    ctaBody: 'ಸಹಯೋಗ, ಸ್ವಯಂಸೇವೆ ಅಥವಾ GEODHAಯನ್ನು ನಿಮ್ಮ ನಗರಕ್ಕೆ ತರಲು ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ.',
    ctaWhatsapp: 'WhatsApp ಸಮುದಾಯ',
  },
};
