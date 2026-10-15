import { SceneNode, FrameNode, TextNode, ShapeNode, ImageNode, Fill, Stroke, Effect } from '@figma-app/shared-types';
import { createId } from '@figma-app/document-model';

export type DesignTheme = 'auto' | 'dark' | 'light' | 'indigo' | 'cyberpunk' | 'minimal';

export interface ThemeColors {
  bg: string;
  cardBg: string;
  cardBgElevated: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSecondary: string;
  accentGradient: [string, string];
  success: string;
}

export const THEMES: Record<Exclude<DesignTheme, 'auto'>, ThemeColors> = {
  dark: {
    bg: '#09090b',
    cardBg: '#18181b',
    cardBgElevated: '#27272a',
    border: '#27272a',
    textPrimary: '#f4f4f5',
    textSecondary: '#a1a1aa',
    textMuted: '#71717a',
    accent: '#0d99ff',
    accentSecondary: '#6366f1',
    accentGradient: ['#0d99ff', '#6366f1'],
    success: '#10b981',
  },
  light: {
    bg: '#f8fafc',
    cardBg: '#ffffff',
    cardBgElevated: '#f1f5f9',
    border: '#e2e8f0',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    accent: '#2563eb',
    accentSecondary: '#4f46e5',
    accentGradient: ['#2563eb', '#7c3aed'],
    success: '#059669',
  },
  indigo: {
    bg: '#0f172a',
    cardBg: '#1e1b4b',
    cardBgElevated: '#312e81',
    border: '#3730a3',
    textPrimary: '#ffffff',
    textSecondary: '#c7d2fe',
    textMuted: '#818cf8',
    accent: '#6366f1',
    accentSecondary: '#8b5cf6',
    accentGradient: ['#6366f1', '#a855f7'],
    success: '#34d399',
  },
  cyberpunk: {
    bg: '#050508',
    cardBg: '#0f0f1b',
    cardBgElevated: '#1a1a2e',
    border: '#ff007a',
    textPrimary: '#00f0ff',
    textSecondary: '#e0e0ff',
    textMuted: '#7979b0',
    accent: '#00f0ff',
    accentSecondary: '#ff007a',
    accentGradient: ['#00f0ff', '#ff007a'],
    success: '#00ff66',
  },
  minimal: {
    bg: '#ffffff',
    cardBg: '#fafafa',
    cardBgElevated: '#f4f4f5',
    border: '#e4e4e7',
    textPrimary: '#18181b',
    textSecondary: '#52525b',
    textMuted: '#a1a1aa',
    accent: '#18181b',
    accentSecondary: '#27272a',
    accentGradient: ['#18181b', '#3f3f46'],
    success: '#16a34a',
  },
};

export interface GeneratedDesignResult {
  title: string;
  nodes: SceneNode[];
  rootFrameId: string;
  width: number;
  height: number;
}

// Helper to create solid fill
function solidFill(color: string, opacity: number = 1): Fill[] {
  return [{ id: createId('f'), type: 'solid', color, opacity, visible: true }];
}

// Helper to create solid stroke
function solidStroke(color: string, width: number = 1): Stroke[] {
  return [{ id: createId('s'), color, width, opacity: 1, visible: true, align: 'inside' }];
}

// Helper to create drop shadow effect
function dropShadow(blur: number = 12, opacity: number = 0.25, y: number = 4): Effect[] {
  return [
    {
      id: createId('eff'),
      type: 'drop-shadow',
      color: `rgba(0,0,0,${opacity})`,
      offset: { x: 0, y },
      radius: blur,
      spread: 0,
      visible: true,
    },
  ];
}

// Helper to create image fill
function imageFill(imageUrl: string): Fill[] {
  return [{ id: createId('f_img'), type: 'image', imageUrl, opacity: 1, visible: true }];
}

// Generate SaaS Pricing Cards
export function generatePricingCards(originX: number, originY: number, theme: ThemeColors): GeneratedDesignResult {
  const rootId = createId('frm_pricing');
  const nodes: SceneNode[] = [];
  const rootWidth = 960;
  const rootHeight = 620;

  // Root Frame
  const rootFrame: FrameNode = {
    id: rootId,
    name: 'Pricing Plans',
    type: 'frame',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: originX, y: originY, width: rootWidth, height: rootHeight, rotation: 0 },
    fills: solidFill(theme.bg),
    strokes: solidStroke(theme.border),
    effects: dropShadow(20, 0.15, 8),
    cornerRadius: 24,
    clipContent: true,
    children: [],
  };

  // Header Title
  const titleId = createId('txt_title');
  const titleNode: TextNode = {
    id: titleId,
    name: 'Section Title',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 80, y: 44, width: rootWidth - 160, height: 38, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: 'Flexible Plans for High-Growth Teams',
    fontFamily: 'Inter',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  };

  // Subtitle
  const subId = createId('txt_sub');
  const subNode: TextNode = {
    id: subId,
    name: 'Section Subtitle',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 120, y: 88, width: rootWidth - 240, height: 24, rotation: 0 },
    fills: solidFill(theme.textSecondary),
    strokes: [],
    effects: [],
    content: 'Choose the plan that suits your creative workflow. Cancel anytime.',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: 'normal',
    textAlign: 'center',
  };

  rootFrame.children!.push(titleId, subId);
  nodes.push(titleNode, subNode);

  // 3 Pricing Cards
  const plans = [
    { name: 'Starter', price: '$19', desc: 'For freelance creators & solopreneurs', featured: false, cta: 'Start Free Trial' },
    { name: 'Professional', price: '$49', desc: 'For growing design & product studios', featured: true, cta: 'Get Started Pro' },
    { name: 'Enterprise', price: '$99', desc: 'Custom security, SSO & dedicated compute', featured: false, cta: 'Contact Sales' },
  ];

  const cardWidth = 260;
  const cardHeight = 440;
  const startX = 40;
  const gap = 30;
  const startY = 140;

  plans.forEach((plan, i) => {
    const cardId = createId(`card_${i}`);
    const cardX = startX + i * (cardWidth + gap);

    const cardFrame: FrameNode = {
      id: cardId,
      name: `${plan.name} Tier`,
      type: 'frame',
      parent: rootId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: cardX, y: startY, width: cardWidth, height: cardHeight, rotation: 0 },
      fills: solidFill(plan.featured ? theme.cardBgElevated : theme.cardBg),
      strokes: solidStroke(plan.featured ? theme.accent : theme.border, plan.featured ? 2 : 1),
      effects: plan.featured ? dropShadow(24, 0.25, 12) : dropShadow(10, 0.08, 4),
      cornerRadius: 16,
      clipContent: true,
      children: [],
    };

    // Plan Name
    const planNameId = createId('txt_pname');
    const planNameNode: TextNode = {
      id: planNameId,
      name: 'Plan Name',
      type: 'text',
      parent: cardId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 20, y: 24, width: 220, height: 22, rotation: 0 },
      fills: solidFill(plan.featured ? theme.accent : theme.textPrimary),
      strokes: [],
      effects: [],
      content: plan.name,
      fontFamily: 'Inter',
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'left',
    };

    // Price
    const priceId = createId('txt_price');
    const priceNode: TextNode = {
      id: priceId,
      name: 'Price',
      type: 'text',
      parent: cardId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 20, y: 52, width: 220, height: 42, rotation: 0 },
      fills: solidFill(theme.textPrimary),
      strokes: [],
      effects: [],
      content: `${plan.price} /mo`,
      fontFamily: 'Inter',
      fontSize: 28,
      fontWeight: 'bold',
      textAlign: 'left',
    };

    // Description
    const descId = createId('txt_desc');
    const descNode: TextNode = {
      id: descId,
      name: 'Description',
      type: 'text',
      parent: cardId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 20, y: 98, width: 220, height: 36, rotation: 0 },
      fills: solidFill(theme.textSecondary),
      strokes: [],
      effects: [],
      content: plan.desc,
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: 'normal',
      textAlign: 'left',
    };

    // Feature items
    const features = [
      'Unlimited vector exports',
      'Real-time multiplayer editing',
      plan.featured ? 'Priority AI Design Agent' : 'Standard design builder',
      'Advanced version history',
    ];

    const featureIds: string[] = [];
    features.forEach((feat, fi) => {
      const featId = createId(`feat_${fi}`);
      const featNode: TextNode = {
        id: featId,
        name: `Feature ${fi + 1}`,
        type: 'text',
        parent: cardId,
        visible: true,
        locked: false,
        opacity: 1,
        transform: { x: 20, y: 154 + fi * 32, width: 220, height: 20, rotation: 0 },
        fills: solidFill(theme.textSecondary),
        strokes: [],
        effects: [],
        content: `✓  ${feat}`,
        fontFamily: 'Inter',
        fontSize: 12,
        fontWeight: 'normal',
        textAlign: 'left',
      };
      featureIds.push(featId);
      nodes.push(featNode);
    });

    // CTA Button
    const btnId = createId('btn_cta');
    const btnFrame: FrameNode = {
      id: btnId,
      name: 'CTA Button',
      type: 'frame',
      parent: cardId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 20, y: 370, width: 220, height: 44, rotation: 0 },
      fills: solidFill(plan.featured ? theme.accent : theme.cardBgElevated),
      strokes: solidStroke(plan.featured ? theme.accent : theme.border),
      effects: plan.featured ? dropShadow(8, 0.2, 3) : [],
      cornerRadius: 10,
      clipContent: true,
      children: [],
    };

    const btnTextId = createId('txt_btn');
    const btnTextNode: TextNode = {
      id: btnTextId,
      name: 'Button Label',
      type: 'text',
      parent: btnId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 0, y: 12, width: 220, height: 20, rotation: 0 },
      fills: solidFill(plan.featured ? '#ffffff' : theme.textPrimary),
      strokes: [],
      effects: [],
      content: plan.cta,
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: 'bold',
      textAlign: 'center',
    };
    btnFrame.children!.push(btnTextId);

    cardFrame.children!.push(planNameId, priceId, descId, ...featureIds, btnId);
    nodes.push(cardFrame, planNameNode, priceNode, descNode, btnFrame, btnTextNode);
    rootFrame.children!.push(cardId);
  });

  nodes.unshift(rootFrame);
  return { title: 'SaaS Pricing Table', nodes, rootFrameId: rootId, width: rootWidth, height: rootHeight };
}

// Generate Landing Page Hero Section
export function generateLandingHero(originX: number, originY: number, theme: ThemeColors): GeneratedDesignResult {
  const rootId = createId('frm_hero');
  const nodes: SceneNode[] = [];
  const rootWidth = 1040;
  const rootHeight = 580;

  const rootFrame: FrameNode = {
    id: rootId,
    name: 'Landing Page Hero',
    type: 'frame',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: originX, y: originY, width: rootWidth, height: rootHeight, rotation: 0 },
    fills: solidFill(theme.bg),
    strokes: solidStroke(theme.border),
    effects: dropShadow(24, 0.15, 10),
    cornerRadius: 24,
    clipContent: true,
    children: [],
  };

  // Badge pill
  const badgeId = createId('badge_frm');
  const badgeFrame: FrameNode = {
    id: badgeId,
    name: 'Release Badge',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 80, y: 60, width: 240, height: 32, rotation: 0 },
    fills: solidFill(theme.cardBgElevated),
    strokes: solidStroke(theme.accent, 1),
    effects: [],
    cornerRadius: 16,
    clipContent: true,
    children: [],
  };

  const badgeTextId = createId('txt_badge');
  const badgeText: TextNode = {
    id: badgeTextId,
    name: 'Badge Text',
    type: 'text',
    parent: badgeId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 10, y: 7, width: 220, height: 18, rotation: 0 },
    fills: solidFill(theme.accent),
    strokes: [],
    effects: [],
    content: '✨ Announcing Studio AI 2.0  →',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  };
  badgeFrame.children!.push(badgeTextId);

  // Main Headline
  const h1Id = createId('txt_h1');
  const h1Node: TextNode = {
    id: h1Id,
    name: 'Main Headline',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 80, y: 110, width: 560, height: 96, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: 'Collaborate & Design at Light Speed with Antigravity AI',
    fontFamily: 'Inter',
    fontSize: 34,
    fontWeight: 'bold',
    textAlign: 'left',
  };

  // Subheadline
  const pId = createId('txt_lead');
  const pNode: TextNode = {
    id: pId,
    name: 'Lead Paragraph',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 80, y: 220, width: 520, height: 50, rotation: 0 },
    fills: solidFill(theme.textSecondary),
    strokes: [],
    effects: [],
    content: 'Turn your product ideas into responsive vector prototypes in minutes with interactive AI copilot.',
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: 'normal',
    textAlign: 'left',
  };

  // Button 1: Primary CTA
  const btn1Id = createId('btn_cta_pri');
  const btn1Frame: FrameNode = {
    id: btn1Id,
    name: 'Primary Button',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 80, y: 290, width: 170, height: 46, rotation: 0 },
    fills: solidFill(theme.accent),
    strokes: [],
    effects: dropShadow(10, 0.25, 4),
    cornerRadius: 10,
    clipContent: true,
    children: [],
  };
  const btn1TextId = createId('txt_cta_pri');
  const btn1Text: TextNode = {
    id: btn1TextId,
    name: 'Button Text',
    type: 'text',
    parent: btn1Id,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 13, width: 170, height: 20, rotation: 0 },
    fills: solidFill('#ffffff'),
    strokes: [],
    effects: [],
    content: 'Get Started Free',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  };
  btn1Frame.children!.push(btn1TextId);

  // Button 2: Secondary CTA
  const btn2Id = createId('btn_cta_sec');
  const btn2Frame: FrameNode = {
    id: btn2Id,
    name: 'Secondary Button',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 265, y: 290, width: 150, height: 46, rotation: 0 },
    fills: solidFill(theme.cardBgElevated),
    strokes: solidStroke(theme.border),
    effects: [],
    cornerRadius: 10,
    clipContent: true,
    children: [],
  };
  const btn2TextId = createId('txt_cta_sec');
  const btn2Text: TextNode = {
    id: btn2TextId,
    name: 'Button Text',
    type: 'text',
    parent: btn2Id,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 13, width: 150, height: 20, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: 'Live Demo ▷',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: 'normal',
    textAlign: 'center',
  };
  btn2Frame.children!.push(btn2TextId);

  // Right Side Preview Mockup Card
  const mockupId = createId('mockup_card');
  const mockupFrame: FrameNode = {
    id: mockupId,
    name: 'App Mockup Preview',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 670, y: 80, width: 310, height: 420, rotation: 0 },
    fills: solidFill(theme.cardBg),
    strokes: solidStroke(theme.border),
    effects: dropShadow(28, 0.2, 14),
    cornerRadius: 18,
    clipContent: true,
    children: [],
  };

  const mockupTitleId = createId('txt_mock_t');
  const mockupTitle: TextNode = {
    id: mockupTitleId,
    name: 'Mockup Header',
    type: 'text',
    parent: mockupId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 20, y: 24, width: 270, height: 24, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: 'Interactive Prototype',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'left',
  };

  const mockupRect1Id = createId('rect_m1');
  const mockupRect1: ShapeNode = {
    id: mockupRect1Id,
    name: 'Chart Visual 1',
    type: 'rect',
    parent: mockupId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 20, y: 64, width: 270, height: 160, rotation: 0 },
    fills: solidFill(theme.accent, 0.15),
    strokes: solidStroke(theme.accent, 1),
    effects: [],
    cornerRadius: 12,
  };

  const mockupRect2Id = createId('rect_m2');
  const mockupRect2: ShapeNode = {
    id: mockupRect2Id,
    name: 'Widget Visual 2',
    type: 'rect',
    parent: mockupId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 20, y: 240, width: 270, height: 70, rotation: 0 },
    fills: solidFill(theme.cardBgElevated),
    strokes: solidStroke(theme.border),
    effects: [],
    cornerRadius: 10,
  };

  mockupFrame.children!.push(mockupTitleId, mockupRect1Id, mockupRect2Id);

  rootFrame.children!.push(badgeId, h1Id, pId, btn1Id, btn2Id, mockupId);
  nodes.push(
    rootFrame,
    badgeFrame,
    badgeText,
    h1Node,
    pNode,
    btn1Frame,
    btn1Text,
    btn2Frame,
    btn2Text,
    mockupFrame,
    mockupTitle,
    mockupRect1,
    mockupRect2
  );

  return { title: 'Landing Page Hero', nodes, rootFrameId: rootId, width: rootWidth, height: rootHeight };
}

// Generate Authentication / Login Modal
export function generateLoginModal(originX: number, originY: number, theme: ThemeColors): GeneratedDesignResult {
  const rootId = createId('frm_auth');
  const nodes: SceneNode[] = [];
  const rootWidth = 440;
  const rootHeight = 520;

  const rootFrame: FrameNode = {
    id: rootId,
    name: 'Sign In Dialog',
    type: 'frame',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: originX, y: originY, width: rootWidth, height: rootHeight, rotation: 0 },
    fills: solidFill(theme.cardBg),
    strokes: solidStroke(theme.border),
    effects: dropShadow(24, 0.25, 12),
    cornerRadius: 20,
    clipContent: true,
    children: [],
  };

  // Header Title
  const titleId = createId('txt_auth_t');
  const titleNode: TextNode = {
    id: titleId,
    name: 'Modal Title',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 40, y: 36, width: 360, height: 32, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: 'Welcome Back',
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  };

  // Subtitle
  const subId = createId('txt_auth_s');
  const subNode: TextNode = {
    id: subId,
    name: 'Modal Subtitle',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 40, y: 74, width: 360, height: 20, rotation: 0 },
    fills: solidFill(theme.textSecondary),
    strokes: [],
    effects: [],
    content: 'Enter your credentials to access your workspaces',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: 'normal',
    textAlign: 'center',
  };

  // Email Input Box
  const emailBoxId = createId('frm_in_email');
  const emailBox: FrameNode = {
    id: emailBoxId,
    name: 'Email Input',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 40, y: 120, width: 360, height: 48, rotation: 0 },
    fills: solidFill(theme.cardBgElevated),
    strokes: solidStroke(theme.border),
    effects: [],
    cornerRadius: 10,
    children: [],
    clipContent: true,
  };
  const emailTextId = createId('txt_email_ph');
  const emailText: TextNode = {
    id: emailTextId,
    name: 'Email Placeholder',
    type: 'text',
    parent: emailBoxId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 16, y: 15, width: 328, height: 18, rotation: 0 },
    fills: solidFill(theme.textMuted),
    strokes: [],
    effects: [],
    content: 'alex.design@company.com',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: 'normal',
    textAlign: 'left',
  };
  emailBox.children!.push(emailTextId);

  // Password Input Box
  const passBoxId = createId('frm_in_pass');
  const passBox: FrameNode = {
    id: passBoxId,
    name: 'Password Input',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 40, y: 184, width: 360, height: 48, rotation: 0 },
    fills: solidFill(theme.cardBgElevated),
    strokes: solidStroke(theme.border),
    effects: [],
    cornerRadius: 10,
    children: [],
    clipContent: true,
  };
  const passTextId = createId('txt_pass_ph');
  const passText: TextNode = {
    id: passTextId,
    name: 'Password Placeholder',
    type: 'text',
    parent: passBoxId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 16, y: 15, width: 328, height: 18, rotation: 0 },
    fills: solidFill(theme.textMuted),
    strokes: [],
    effects: [],
    content: '••••••••••••••••',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: 'normal',
    textAlign: 'left',
  };
  passBox.children!.push(passTextId);

  // Sign In Button
  const submitBtnId = createId('btn_auth_submit');
  const submitBtn: FrameNode = {
    id: submitBtnId,
    name: 'Sign In Button',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 40, y: 256, width: 360, height: 48, rotation: 0 },
    fills: solidFill(theme.accent),
    strokes: [],
    effects: dropShadow(12, 0.25, 4),
    cornerRadius: 10,
    children: [],
    clipContent: true,
  };
  const submitTextId = createId('txt_btn_sub');
  const submitText: TextNode = {
    id: submitTextId,
    name: 'Button Label',
    type: 'text',
    parent: submitBtnId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 14, width: 360, height: 20, rotation: 0 },
    fills: solidFill('#ffffff'),
    strokes: [],
    effects: [],
    content: 'Sign In to Account',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  };
  submitBtn.children!.push(submitTextId);

  // Social Button (Google)
  const googleBtnId = createId('btn_google');
  const googleBtn: FrameNode = {
    id: googleBtnId,
    name: 'Continue with Google',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 40, y: 324, width: 360, height: 46, rotation: 0 },
    fills: solidFill(theme.cardBgElevated),
    strokes: solidStroke(theme.border),
    effects: [],
    cornerRadius: 10,
    children: [],
    clipContent: true,
  };
  const googleTextId = createId('txt_g_lbl');
  const googleText: TextNode = {
    id: googleTextId,
    name: 'Google Label',
    type: 'text',
    parent: googleBtnId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 13, width: 360, height: 20, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: 'Continue with Google',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: 'normal',
    textAlign: 'center',
  };
  googleBtn.children!.push(googleTextId);

  // Footer Link
  const footerId = createId('txt_auth_ft');
  const footerText: TextNode = {
    id: footerId,
    name: 'Footer Link',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 40, y: 400, width: 360, height: 20, rotation: 0 },
    fills: solidFill(theme.textSecondary),
    strokes: [],
    effects: [],
    content: "Don't have an account? Sign Up Free",
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 'normal',
    textAlign: 'center',
  };

  rootFrame.children!.push(titleId, subId, emailBoxId, passBoxId, submitBtnId, googleBtnId, footerId);
  nodes.push(
    rootFrame,
    titleNode,
    subNode,
    emailBox,
    emailText,
    passBox,
    passText,
    submitBtn,
    submitText,
    googleBtn,
    googleText,
    footerText
  );

  return { title: 'Sign In Dialog', nodes, rootFrameId: rootId, width: rootWidth, height: rootHeight };
}

// Generate KPI Analytics Dashboard Cards
export function generateAnalyticsDashboard(originX: number, originY: number, theme: ThemeColors): GeneratedDesignResult {
  const rootId = createId('frm_dash');
  const nodes: SceneNode[] = [];
  const rootWidth = 920;
  const rootHeight = 440;

  const rootFrame: FrameNode = {
    id: rootId,
    name: 'Analytics Dashboard',
    type: 'frame',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: originX, y: originY, width: rootWidth, height: rootHeight, rotation: 0 },
    fills: solidFill(theme.bg),
    strokes: solidStroke(theme.border),
    effects: dropShadow(20, 0.15, 8),
    cornerRadius: 20,
    clipContent: true,
    children: [],
  };

  // Header Title
  const titleId = createId('txt_dash_t');
  const titleNode: TextNode = {
    id: titleId,
    name: 'Dashboard Title',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 40, y: 32, width: 400, height: 28, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: 'Performance Metrics & Insights',
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'left',
  };
  rootFrame.children!.push(titleId);
  nodes.push(titleNode);

  const kpis = [
    { title: 'Total Revenue', value: '$124,590', change: '+18.4%', positive: true },
    { title: 'Active Designers', value: '38,420', change: '+12.1%', positive: true },
    { title: 'Components Synced', value: '1.2M', change: '+34.8%', positive: true },
    { title: 'Bounce Rate', value: '2.4%', change: '-0.6%', positive: true },
  ];

  const cardW = 195;
  const cardH = 130;
  const startX = 40;
  const gap = 20;

  kpis.forEach((kpi, idx) => {
    const cardId = createId(`kpi_${idx}`);
    const cardX = startX + idx * (cardW + gap);

    const cardFrame: FrameNode = {
      id: cardId,
      name: `${kpi.title} Card`,
      type: 'frame',
      parent: rootId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: cardX, y: 80, width: cardW, height: cardH, rotation: 0 },
      fills: solidFill(theme.cardBg),
      strokes: solidStroke(theme.border),
      effects: dropShadow(8, 0.08, 3),
      cornerRadius: 14,
      clipContent: true,
      children: [],
    };

    const labelId = createId('txt_klabel');
    const labelNode: TextNode = {
      id: labelId,
      name: 'Label',
      type: 'text',
      parent: cardId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 16, y: 16, width: cardW - 32, height: 18, rotation: 0 },
      fills: solidFill(theme.textSecondary),
      strokes: [],
      effects: [],
      content: kpi.title,
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: 'normal',
      textAlign: 'left',
    };

    const valId = createId('txt_kval');
    const valNode: TextNode = {
      id: valId,
      name: 'Metric Value',
      type: 'text',
      parent: cardId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 16, y: 44, width: cardW - 32, height: 32, rotation: 0 },
      fills: solidFill(theme.textPrimary),
      strokes: [],
      effects: [],
      content: kpi.value,
      fontFamily: 'Inter',
      fontSize: 22,
      fontWeight: 'bold',
      textAlign: 'left',
    };

    const changeId = createId('txt_kchange');
    const changeNode: TextNode = {
      id: changeId,
      name: 'Change Badge',
      type: 'text',
      parent: cardId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 16, y: 88, width: cardW - 32, height: 18, rotation: 0 },
      fills: solidFill(kpi.positive ? theme.success : '#f43f5e'),
      strokes: [],
      effects: [],
      content: `▲ ${kpi.change} vs last mo`,
      fontFamily: 'Inter',
      fontSize: 11,
      fontWeight: 'bold',
      textAlign: 'left',
    };

    cardFrame.children!.push(labelId, valId, changeId);
    nodes.push(cardFrame, labelNode, valNode, changeNode);
    rootFrame.children!.push(cardId);
  });

  // Chart Frame Below
  const chartFrameId = createId('frm_chart_area');
  const chartFrame: FrameNode = {
    id: chartFrameId,
    name: 'Growth Chart',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 40, y: 230, width: 840, height: 170, rotation: 0 },
    fills: solidFill(theme.cardBgElevated),
    strokes: solidStroke(theme.border),
    effects: [],
    cornerRadius: 14,
    clipContent: true,
    children: [],
  };

  // Decorative Bar Graphs inside Chart
  const barHeights = [40, 75, 55, 90, 110, 80, 130, 95, 120, 140, 115, 150];
  const barW = 38;
  const barGap = 28;
  const chartStartX = 40;

  barHeights.forEach((bh, bi) => {
    const barId = createId(`bar_${bi}`);
    const barNode: ShapeNode = {
      id: barId,
      name: `Bar ${bi + 1}`,
      type: 'rect',
      parent: chartFrameId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: chartStartX + bi * (barW + barGap), y: 160 - bh, width: barW, height: bh, rotation: 0 },
      fills: solidFill(bi === barHeights.length - 1 ? theme.accent : theme.accent, 0.45 + (bi / barHeights.length) * 0.55),
      strokes: [],
      effects: [],
      cornerRadius: 6,
    };
    chartFrame.children!.push(barId);
    nodes.push(barNode);
  });

  rootFrame.children!.push(chartFrameId);
  nodes.push(chartFrame);
  nodes.unshift(rootFrame);

  return { title: 'Analytics Dashboard', nodes, rootFrameId: rootId, width: rootWidth, height: rootHeight };
}

// Generate Modern Navbar
export function generateNavbar(originX: number, originY: number, theme: ThemeColors): GeneratedDesignResult {
  const rootId = createId('frm_nav');
  const nodes: SceneNode[] = [];
  const rootWidth = 980;
  const rootHeight = 72;

  const rootFrame: FrameNode = {
    id: rootId,
    name: 'Navigation Bar',
    type: 'frame',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: originX, y: originY, width: rootWidth, height: rootHeight, rotation: 0 },
    fills: solidFill(theme.cardBg),
    strokes: solidStroke(theme.border),
    effects: dropShadow(12, 0.1, 4),
    cornerRadius: 16,
    clipContent: true,
    children: [],
  };

  // Logo Brand
  const logoId = createId('txt_logo');
  const logoNode: TextNode = {
    id: logoId,
    name: 'Brand Logo',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 28, y: 24, width: 140, height: 24, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: '❖ Antigravity',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'left',
  };

  // Navigation Links
  const links = ['Products', 'Solutions', 'Community', 'Pricing'];
  const linkIds: string[] = [];
  links.forEach((link, idx) => {
    const linkId = createId(`txt_link_${idx}`);
    const linkNode: TextNode = {
      id: linkId,
      name: `Link - ${link}`,
      type: 'text',
      parent: rootId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 220 + idx * 100, y: 26, width: 90, height: 20, rotation: 0 },
      fills: solidFill(idx === 0 ? theme.textPrimary : theme.textSecondary),
      strokes: [],
      effects: [],
      content: link,
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: idx === 0 ? 'bold' : 'normal',
      textAlign: 'left',
    };
    linkIds.push(linkId);
    nodes.push(linkNode);
  });

  // Action Button
  const btnId = createId('btn_nav_cta');
  const btnFrame: FrameNode = {
    id: btnId,
    name: 'Action Button',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: rootWidth - 160, y: 16, width: 132, height: 40, rotation: 0 },
    fills: solidFill(theme.accent),
    strokes: [],
    effects: dropShadow(6, 0.2, 2),
    cornerRadius: 8,
    clipContent: true,
    children: [],
  };

  const btnTextId = createId('txt_nav_btn');
  const btnText: TextNode = {
    id: btnTextId,
    name: 'Button Label',
    type: 'text',
    parent: btnId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 11, width: 132, height: 18, rotation: 0 },
    fills: solidFill('#ffffff'),
    strokes: [],
    effects: [],
    content: 'Start Creating',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  };
  btnFrame.children!.push(btnTextId);

  rootFrame.children!.push(logoId, ...linkIds, btnId);
  nodes.push(rootFrame, logoNode, btnFrame, btnText);

  return { title: 'Modern Navigation Bar', nodes, rootFrameId: rootId, width: rootWidth, height: rootHeight };
}

// Helper to resolve hierarchical relative positions to absolute canvas stage coordinates
function resolveAbsolutePositions(nodes: SceneNode[], rootId: string) {
  const nodeMap = new Map<string, SceneNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  function getAbsolutePos(nodeId: string): { x: number; y: number } {
    const node = nodeMap.get(nodeId);
    if (!node || nodeId === rootId || !node.parent) {
      return { x: node?.transform?.x || 0, y: node?.transform?.y || 0 };
    }
    const parentPos = getAbsolutePos(node.parent);
    return {
      x: parentPos.x + (node.transform?.x || 0),
      y: parentPos.y + (node.transform?.y || 0),
    };
  }

  const absPositions = new Map<string, { x: number; y: number }>();
  nodes.forEach((n) => {
    absPositions.set(n.id, getAbsolutePos(n.id));
  });

  nodes.forEach((n) => {
    const abs = absPositions.get(n.id);
    if (abs && n.transform) {
      n.transform.x = abs.x;
      n.transform.y = abs.y;
    }
  });
}

// Capitalize and format user prompt into an elegant UI title
function formatPromptTitle(prompt: string, fallback: string = 'UI Component'): string {
  const clean = prompt.replace(/[^\w\s-]/g, '').trim();
  if (!clean) return fallback;
  const words = clean.split(/\s+/).slice(0, 5);
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

// 1. E-Commerce / Product Showcase Card Generator
export function generateProductCard(
  originX: number,
  originY: number,
  theme: ThemeColors,
  promptText?: string
): GeneratedDesignResult {
  const rootId = createId('frm_prod');
  const nodes: SceneNode[] = [];
  const rootWidth = 440;
  const rootHeight = 620;

  const title = formatPromptTitle(promptText || 'Nike Air Jordan High', 'Premium Product Card');

  const rootFrame: FrameNode = {
    id: rootId,
    name: `Product - ${title}`,
    type: 'frame',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: originX, y: originY, width: rootWidth, height: rootHeight, rotation: 0 },
    fills: solidFill(theme.bg),
    strokes: solidStroke(theme.border),
    effects: dropShadow(20, 0.15, 8),
    cornerRadius: 24,
    clipContent: true,
    children: [],
  };

  // Product Image / Visual Showcase Area
  const imgFrameId = createId('frm_prod_img');
  const imgFrame: FrameNode = {
    id: imgFrameId,
    name: 'Product Mockup Frame',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 20, y: 20, width: 400, height: 260, rotation: 0 },
    fills: solidFill(theme.cardBgElevated),
    strokes: solidStroke(theme.border),
    effects: [],
    cornerRadius: 18,
    clipContent: true,
    children: [],
  };

  // Discount Badge Frame
  const badgeId = createId('frm_disc_badge');
  const badgeFrame: FrameNode = {
    id: badgeId,
    name: 'Discount Tag',
    type: 'frame',
    parent: imgFrameId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 16, y: 16, width: 92, height: 28, rotation: 0 },
    fills: solidFill(theme.accent),
    strokes: [],
    effects: dropShadow(6, 0.2, 2),
    cornerRadius: 14,
    clipContent: true,
    children: [],
  };
  const badgeTxtId = createId('txt_disc_lbl');
  const badgeTxt: TextNode = {
    id: badgeTxtId,
    name: 'Badge Label',
    type: 'text',
    parent: badgeId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 6, width: 92, height: 16, rotation: 0 },
    fills: solidFill('#ffffff'),
    strokes: [],
    effects: [],
    content: '-20% OFF',
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  };
  badgeFrame.children!.push(badgeTxtId);

  // Center Product Graphic Box
  const centerBoxId = createId('shp_center_prod');
  const centerBox: FrameNode = {
    id: centerBoxId,
    name: 'Product Preview Graphic',
    type: 'frame',
    parent: imgFrameId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 80, y: 55, width: 240, height: 150, rotation: 0 },
    fills: solidFill(theme.cardBg),
    strokes: solidStroke(theme.accent, 1),
    effects: dropShadow(14, 0.2, 6),
    cornerRadius: 16,
    clipContent: true,
    children: [],
  };
  const iconTxtId = createId('txt_prod_icon');
  const iconTxt: TextNode = {
    id: iconTxtId,
    name: 'Icon Symbol',
    type: 'text',
    parent: centerBoxId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 48, width: 240, height: 40, rotation: 0 },
    fills: solidFill(theme.accent),
    strokes: [],
    effects: [],
    content: '👟  ORIGINAL',
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  };
  centerBox.children!.push(iconTxtId);
  imgFrame.children!.push(badgeId, centerBoxId);

  // Product Category & Title
  const catId = createId('txt_cat');
  const catNode: TextNode = {
    id: catId,
    name: 'Category Tag',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 24, y: 298, width: 390, height: 18, rotation: 0 },
    fills: solidFill(theme.accent),
    strokes: [],
    effects: [],
    content: 'OFFICIAL STORE • NEW RELEASE',
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: 'bold',
  };

  const titleId = createId('txt_prod_name');
  const titleNode: TextNode = {
    id: titleId,
    name: 'Product Title',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 24, y: 322, width: 390, height: 28, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: title,
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: 'bold',
  };

  // Rating Stars
  const ratingId = createId('txt_prod_rating');
  const ratingNode: TextNode = {
    id: ratingId,
    name: 'Rating & Reviews',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 24, y: 356, width: 390, height: 18, rotation: 0 },
    fills: solidFill('#f59e0b'),
    strokes: [],
    effects: [],
    content: '★★★★★  4.9 (1,840 Verified Reviews)',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
  };

  // Price Row
  const priceId = createId('txt_curr_price');
  const priceNode: TextNode = {
    id: priceId,
    name: 'Current Price',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 24, y: 386, width: 140, height: 32, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: '$185.00',
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: 'bold',
  };

  const oldPriceId = createId('txt_old_price');
  const oldPriceNode: TextNode = {
    id: oldPriceId,
    name: 'Original Price',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 140, y: 394, width: 100, height: 20, rotation: 0 },
    fills: solidFill(theme.textMuted),
    strokes: [],
    effects: [],
    content: '$240.00',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: 'normal',
  };

  // Size Selector Pills
  const sizes = ['US 8', 'US 9', 'US 10', 'US 11'];
  const sizeIds: string[] = [];
  sizes.forEach((sz, si) => {
    const sFrameId = createId(`frm_sz_${si}`);
    const sFrame: FrameNode = {
      id: sFrameId,
      name: `Size ${sz}`,
      type: 'frame',
      parent: rootId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 24 + si * 64, y: 440, width: 56, height: 34, rotation: 0 },
      fills: solidFill(si === 1 ? theme.accent : theme.cardBg),
      strokes: solidStroke(si === 1 ? theme.accent : theme.border),
      effects: [],
      cornerRadius: 10,
      clipContent: true,
      children: [],
    };
    const sTxtId = createId(`txt_sz_${si}`);
    const sTxt: TextNode = {
      id: sTxtId,
      name: 'Size Label',
      type: 'text',
      parent: sFrameId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 0, y: 8, width: 56, height: 18, rotation: 0 },
      fills: solidFill(si === 1 ? '#ffffff' : theme.textPrimary),
      strokes: [],
      effects: [],
      content: sz,
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center',
    };
    sFrame.children!.push(sTxtId);
    sizeIds.push(sFrameId);
    nodes.push(sFrame, sTxt);
  });

  // Action Button
  const btnId = createId('btn_add_cart');
  const btnFrame: FrameNode = {
    id: btnId,
    name: 'Add to Cart Button',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 24, y: 530, width: 392, height: 52, rotation: 0 },
    fills: solidFill(theme.accent),
    strokes: [],
    effects: dropShadow(12, 0.25, 4),
    cornerRadius: 14,
    clipContent: true,
    children: [],
  };
  const btnTxtId = createId('txt_btn_cart');
  const btnTxt: TextNode = {
    id: btnTxtId,
    name: 'Button Label',
    type: 'text',
    parent: btnId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 16, width: 392, height: 20, rotation: 0 },
    fills: solidFill('#ffffff'),
    strokes: [],
    effects: [],
    content: 'Add to Bag  •  $185.00  →',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  };
  btnFrame.children!.push(btnTxtId);

  rootFrame.children!.push(imgFrameId, catId, titleId, ratingId, priceId, oldPriceId, ...sizeIds, btnId);
  nodes.push(rootFrame, imgFrame, badgeFrame, badgeTxt, centerBox, iconTxt, catNode, titleNode, ratingNode, priceNode, oldPriceNode, btnFrame, btnTxt);

  return { title: 'Product Showcase Card', nodes, rootFrameId: rootId, width: rootWidth, height: rootHeight };
}

// 2. User Profile Card Generator
export function generateProfileCard(
  originX: number,
  originY: number,
  theme: ThemeColors,
  promptText?: string
): GeneratedDesignResult {
  const rootId = createId('frm_prof');
  const nodes: SceneNode[] = [];
  const rootWidth = 420;
  const rootHeight = 540;

  const name = formatPromptTitle(promptText || 'Alex Morgan', 'User Profile Card');

  const rootFrame: FrameNode = {
    id: rootId,
    name: `Profile - ${name}`,
    type: 'frame',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: originX, y: originY, width: rootWidth, height: rootHeight, rotation: 0 },
    fills: solidFill(theme.bg),
    strokes: solidStroke(theme.border),
    effects: dropShadow(20, 0.15, 8),
    cornerRadius: 24,
    clipContent: true,
    children: [],
  };

  // Header Banner
  const bannerId = createId('frm_banner');
  const banner: FrameNode = {
    id: bannerId,
    name: 'Profile Banner',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 0, width: 420, height: 130, rotation: 0 },
    fills: solidFill(theme.accentSecondary),
    strokes: [],
    effects: [],
    cornerRadius: 0,
    clipContent: true,
    children: [],
  };

  // Avatar Circle
  const avatarId = createId('shp_avatar');
  const avatarNode: ShapeNode = {
    id: avatarId,
    name: 'User Avatar',
    type: 'ellipse',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 32, y: 86, width: 84, height: 84, rotation: 0 },
    fills: solidFill(theme.cardBgElevated),
    strokes: solidStroke(theme.bg, 4),
    effects: dropShadow(8, 0.2, 3),
  };

  const nameId = createId('txt_user_name');
  const nameNode: TextNode = {
    id: nameId,
    name: 'Full Name',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 32, y: 184, width: 356, height: 26, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: `${name}  ✓`,
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: 'bold',
  };

  const handleId = createId('txt_handle');
  const handleNode: TextNode = {
    id: handleId,
    name: 'Handle & Role',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 32, y: 214, width: 356, height: 18, rotation: 0 },
    fills: solidFill(theme.accent),
    strokes: [],
    effects: [],
    content: `@${name.toLowerCase().replace(/\s+/g, '_')} • Lead Product Architect`,
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
  };

  const bioId = createId('txt_bio');
  const bioNode: TextNode = {
    id: bioId,
    name: 'User Biography',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 32, y: 242, width: 356, height: 42, rotation: 0 },
    fills: solidFill(theme.textSecondary),
    strokes: [],
    effects: [],
    content: 'Building next-generation vector design systems, component libraries, and visual AI copilots.',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: 'normal',
    lineHeight: 20,
  };

  // Stats Box
  const statsBoxId = createId('frm_stats_box');
  const statsBox: FrameNode = {
    id: statsBoxId,
    name: 'Metrics Summary',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 32, y: 304, width: 356, height: 74, rotation: 0 },
    fills: solidFill(theme.cardBg),
    strokes: solidStroke(theme.border),
    effects: [],
    cornerRadius: 14,
    clipContent: true,
    children: [],
  };

  const stats = [
    { label: 'Followers', val: '28.4K' },
    { label: 'Following', val: '640' },
    { label: 'Designs', val: '184' },
  ];
  const statIds: string[] = [];
  stats.forEach((st, si) => {
    const vId = createId(`txt_sv_${si}`);
    const vNode: TextNode = {
      id: vId,
      name: `Val ${st.label}`,
      type: 'text',
      parent: statsBoxId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: si * 118, y: 14, width: 118, height: 24, rotation: 0 },
      fills: solidFill(theme.textPrimary),
      strokes: [],
      effects: [],
      content: st.val,
      fontFamily: 'Inter',
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
    };
    const lId = createId(`txt_sl_${si}`);
    const lNode: TextNode = {
      id: lId,
      name: `Label ${st.label}`,
      type: 'text',
      parent: statsBoxId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: si * 118, y: 42, width: 118, height: 16, rotation: 0 },
      fills: solidFill(theme.textMuted),
      strokes: [],
      effects: [],
      content: st.label,
      fontFamily: 'Inter',
      fontSize: 11,
      fontWeight: 'normal',
      textAlign: 'center',
    };
    statIds.push(vId, lId);
    nodes.push(vNode, lNode);
  });
  statsBox.children!.push(...statIds);

  // Buttons: Follow & Message
  const btn1Id = createId('btn_follow');
  const btn1: FrameNode = {
    id: btn1Id,
    name: 'Follow Button',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 32, y: 406, width: 172, height: 46, rotation: 0 },
    fills: solidFill(theme.accent),
    strokes: [],
    effects: dropShadow(8, 0.2, 3),
    cornerRadius: 12,
    clipContent: true,
    children: [],
  };
  const btn1TxtId = createId('txt_btn1');
  const btn1Txt: TextNode = {
    id: btn1TxtId,
    name: 'Follow Label',
    type: 'text',
    parent: btn1Id,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 14, width: 172, height: 18, rotation: 0 },
    fills: solidFill('#ffffff'),
    strokes: [],
    effects: [],
    content: 'Follow Creator',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  };
  btn1.children!.push(btn1TxtId);

  const btn2Id = createId('btn_msg');
  const btn2: FrameNode = {
    id: btn2Id,
    name: 'Message Button',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 216, y: 406, width: 172, height: 46, rotation: 0 },
    fills: solidFill(theme.cardBgElevated),
    strokes: solidStroke(theme.border),
    effects: [],
    cornerRadius: 12,
    clipContent: true,
    children: [],
  };
  const btn2TxtId = createId('txt_btn2');
  const btn2Txt: TextNode = {
    id: btn2TxtId,
    name: 'Message Label',
    type: 'text',
    parent: btn2Id,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 14, width: 172, height: 18, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: 'Message',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  };
  btn2.children!.push(btn2TxtId);

  rootFrame.children!.push(bannerId, avatarId, nameId, handleId, bioId, statsBoxId, btn1Id, btn2Id);
  nodes.push(rootFrame, banner, avatarNode, nameNode, handleNode, bioNode, statsBox, btn1, btn1Txt, btn2, btn2Txt);

  return { title: 'User Profile Card', nodes, rootFrameId: rootId, width: rootWidth, height: rootHeight };
}

// 3. Music / Media Player Generator
export function generateMusicPlayer(
  originX: number,
  originY: number,
  theme: ThemeColors,
  promptText?: string
): GeneratedDesignResult {
  const rootId = createId('frm_music');
  const nodes: SceneNode[] = [];
  const rootWidth = 380;
  const rootHeight = 560;

  const track = formatPromptTitle(promptText || 'Neon Midnight Dreams', 'Music Track');

  const rootFrame: FrameNode = {
    id: rootId,
    name: `Player - ${track}`,
    type: 'frame',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: originX, y: originY, width: rootWidth, height: rootHeight, rotation: 0 },
    fills: solidFill(theme.bg),
    strokes: solidStroke(theme.border),
    effects: dropShadow(24, 0.2, 10),
    cornerRadius: 28,
    clipContent: true,
    children: [],
  };

  // Artwork Frame
  const artFrameId = createId('frm_art');
  const artFrame: FrameNode = {
    id: artFrameId,
    name: 'Album Artwork',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 24, y: 24, width: 332, height: 260, rotation: 0 },
    fills: solidFill(theme.cardBgElevated),
    strokes: solidStroke(theme.border),
    effects: dropShadow(16, 0.25, 8),
    cornerRadius: 20,
    clipContent: true,
    children: [],
  };
  const artIconId = createId('txt_art_icon');
  const artIcon: TextNode = {
    id: artIconId,
    name: 'Audio Graphic',
    type: 'text',
    parent: artFrameId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 105, width: 332, height: 50, rotation: 0 },
    fills: solidFill(theme.accent),
    strokes: [],
    effects: [],
    content: '🎵  LOSSLESS AUDIO',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  };
  artFrame.children!.push(artIconId);

  // Track Title & Artist
  const titleId = createId('txt_track_title');
  const titleNode: TextNode = {
    id: titleId,
    name: 'Track Title',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 28, y: 308, width: 324, height: 24, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: track,
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: 'bold',
  };

  const artistId = createId('txt_artist');
  const artistNode: TextNode = {
    id: artistId,
    name: 'Artist & Album',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 28, y: 336, width: 324, height: 18, rotation: 0 },
    fills: solidFill(theme.textSecondary),
    strokes: [],
    effects: [],
    content: 'Studio Electronic Wave • Cyber Echoes',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: 'normal',
  };

  // Progress Bar
  const progBgId = createId('frm_prog_bg');
  const progBg: FrameNode = {
    id: progBgId,
    name: 'Timeline Background',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 28, y: 376, width: 324, height: 6, rotation: 0 },
    fills: solidFill(theme.cardBgElevated),
    strokes: [],
    effects: [],
    cornerRadius: 3,
    clipContent: true,
    children: [],
  };
  const progFillId = createId('frm_prog_fill');
  const progFill: FrameNode = {
    id: progFillId,
    name: 'Timeline Progress',
    type: 'frame',
    parent: progBgId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 0, width: 198, height: 6, rotation: 0 },
    fills: solidFill(theme.accent),
    strokes: [],
    effects: [],
    cornerRadius: 3,
    clipContent: true,
    children: [],
  };
  progBg.children!.push(progFillId);

  // Time labels
  const timeLId = createId('txt_time_l');
  const timeLNode: TextNode = {
    id: timeLId,
    name: 'Elapsed Time',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 28, y: 390, width: 80, height: 16, rotation: 0 },
    fills: solidFill(theme.textMuted),
    strokes: [],
    effects: [],
    content: '2:14',
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: 'normal',
  };

  const timeRId = createId('txt_time_r');
  const timeRNode: TextNode = {
    id: timeRId,
    name: 'Remaining Time',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 272, y: 390, width: 80, height: 16, rotation: 0 },
    fills: solidFill(theme.textMuted),
    strokes: [],
    effects: [],
    content: '-1:46',
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: 'normal',
    textAlign: 'right',
  };

  // Playback Controls
  const prevId = createId('txt_ctrl_prev');
  const prevNode: TextNode = {
    id: prevId,
    name: 'Previous Control',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 60, y: 446, width: 44, height: 32, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: '⏮',
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  };

  const playCircleId = createId('shp_play_circle');
  const playCircle: ShapeNode = {
    id: playCircleId,
    name: 'Play Button Circle',
    type: 'ellipse',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 160, y: 432, width: 60, height: 60, rotation: 0 },
    fills: solidFill(theme.accent),
    strokes: [],
    effects: dropShadow(12, 0.3, 4),
  };

  const playTxtId = createId('txt_play_icon');
  const playTxt: TextNode = {
    id: playTxtId,
    name: 'Play Icon',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 162, y: 450, width: 60, height: 26, rotation: 0 },
    fills: solidFill('#ffffff'),
    strokes: [],
    effects: [],
    content: '▶',
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  };

  const nextId = createId('txt_ctrl_next');
  const nextNode: TextNode = {
    id: nextId,
    name: 'Next Control',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 276, y: 446, width: 44, height: 32, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: '⏭',
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  };

  rootFrame.children!.push(artFrameId, titleId, artistId, progBgId, timeLId, timeRId, prevId, playCircleId, playTxtId, nextId);
  nodes.push(rootFrame, artFrame, artIcon, titleNode, artistNode, progBg, progFill, timeLNode, timeRNode, prevNode, playCircle, playTxt, nextNode);

  return { title: 'Music Player Widget', nodes, rootFrameId: rootId, width: rootWidth, height: rootHeight };
}

// 4. Interactive Contact / Lead Form Generator
export function generateContactForm(
  originX: number,
  originY: number,
  theme: ThemeColors,
  promptText?: string
): GeneratedDesignResult {
  const rootId = createId('frm_contact');
  const nodes: SceneNode[] = [];
  const rootWidth = 480;
  const rootHeight = 620;

  const title = formatPromptTitle(promptText || 'Get in Touch', 'Contact Form');

  const rootFrame: FrameNode = {
    id: rootId,
    name: `Form - ${title}`,
    type: 'frame',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: originX, y: originY, width: rootWidth, height: rootHeight, rotation: 0 },
    fills: solidFill(theme.bg),
    strokes: solidStroke(theme.border),
    effects: dropShadow(20, 0.15, 8),
    cornerRadius: 24,
    clipContent: true,
    children: [],
  };

  const h1Id = createId('txt_form_h1');
  const h1Node: TextNode = {
    id: h1Id,
    name: 'Form Title',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 36, y: 36, width: 408, height: 30, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: title,
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: 'bold',
  };

  const subId = createId('txt_form_sub');
  const subNode: TextNode = {
    id: subId,
    name: 'Form Subtitle',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 36, y: 70, width: 408, height: 20, rotation: 0 },
    fills: solidFill(theme.textSecondary),
    strokes: [],
    effects: [],
    content: 'Send your requirements and our team will get back to you within 24 hours.',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 'normal',
  };

  // Field 1: Name
  const l1Id = createId('txt_lbl_1');
  const l1Node: TextNode = {
    id: l1Id,
    name: 'Label Name',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 36, y: 112, width: 408, height: 18, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: 'Full Name',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
  };
  const b1Id = createId('frm_box_1');
  const b1Frame: FrameNode = {
    id: b1Id,
    name: 'Input Name Box',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 36, y: 134, width: 408, height: 44, rotation: 0 },
    fills: solidFill(theme.cardBg),
    strokes: solidStroke(theme.border),
    effects: [],
    cornerRadius: 10,
    clipContent: true,
    children: [],
  };
  const p1Id = createId('txt_ph_1');
  const p1Node: TextNode = {
    id: p1Id,
    name: 'Placeholder',
    type: 'text',
    parent: b1Id,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 14, y: 13, width: 380, height: 18, rotation: 0 },
    fills: solidFill(theme.textMuted),
    strokes: [],
    effects: [],
    content: 'e.g. Sarah Connor',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: 'normal',
  };
  b1Frame.children!.push(p1Id);

  // Field 2: Email
  const l2Id = createId('txt_lbl_2');
  const l2Node: TextNode = {
    id: l2Id,
    name: 'Label Email',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 36, y: 196, width: 408, height: 18, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: 'Work Email Address',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
  };
  const b2Id = createId('frm_box_2');
  const b2Frame: FrameNode = {
    id: b2Id,
    name: 'Input Email Box',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 36, y: 218, width: 408, height: 44, rotation: 0 },
    fills: solidFill(theme.cardBg),
    strokes: solidStroke(theme.border),
    effects: [],
    cornerRadius: 10,
    clipContent: true,
    children: [],
  };
  const p2Id = createId('txt_ph_2');
  const p2Node: TextNode = {
    id: p2Id,
    name: 'Placeholder',
    type: 'text',
    parent: b2Id,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 14, y: 13, width: 380, height: 18, rotation: 0 },
    fills: solidFill(theme.textMuted),
    strokes: [],
    effects: [],
    content: 'sarah@enterprise.com',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: 'normal',
  };
  b2Frame.children!.push(p2Id);

  // Field 3: Message Textarea
  const l3Id = createId('txt_lbl_3');
  const l3Node: TextNode = {
    id: l3Id,
    name: 'Label Message',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 36, y: 280, width: 408, height: 18, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: 'Project Scope / Message',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
  };
  const b3Id = createId('frm_box_3');
  const b3Frame: FrameNode = {
    id: b3Id,
    name: 'Input Message Box',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 36, y: 302, width: 408, height: 100, rotation: 0 },
    fills: solidFill(theme.cardBg),
    strokes: solidStroke(theme.border),
    effects: [],
    cornerRadius: 10,
    clipContent: true,
    children: [],
  };
  const p3Id = createId('txt_ph_3');
  const p3Node: TextNode = {
    id: p3Id,
    name: 'Placeholder',
    type: 'text',
    parent: b3Id,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 14, y: 14, width: 380, height: 36, rotation: 0 },
    fills: solidFill(theme.textMuted),
    strokes: [],
    effects: [],
    content: 'Describe your vision, goals, and timeline expectations...',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: 'normal',
  };
  b3Frame.children!.push(p3Id);

  // Checkbox row
  const chkBoxId = createId('frm_chk');
  const chkBox: FrameNode = {
    id: chkBoxId,
    name: 'Checkbox',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 36, y: 422, width: 20, height: 20, rotation: 0 },
    fills: solidFill(theme.accent),
    strokes: [],
    effects: [],
    cornerRadius: 5,
    clipContent: true,
    children: [],
  };
  const chkTxtId = createId('txt_chk_mark');
  const chkTxt: TextNode = {
    id: chkTxtId,
    name: 'Check',
    type: 'text',
    parent: chkBoxId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 2, width: 20, height: 16, rotation: 0 },
    fills: solidFill('#ffffff'),
    strokes: [],
    effects: [],
    content: '✓',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  };
  chkBox.children!.push(chkTxtId);

  const chkLblId = createId('txt_chk_lbl');
  const chkLblNode: TextNode = {
    id: chkLblId,
    name: 'Terms Label',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 66, y: 423, width: 378, height: 18, rotation: 0 },
    fills: solidFill(theme.textSecondary),
    strokes: [],
    effects: [],
    content: 'I agree to the privacy policy and data processing terms.',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 'normal',
  };

  // Submit Button
  const btnId = createId('btn_submit');
  const btnFrame: FrameNode = {
    id: btnId,
    name: 'Submit Button',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 36, y: 466, width: 408, height: 48, rotation: 0 },
    fills: solidFill(theme.accent),
    strokes: [],
    effects: dropShadow(12, 0.25, 4),
    cornerRadius: 12,
    clipContent: true,
    children: [],
  };
  const btnTxtId = createId('txt_btn_sub');
  const btnTxt: TextNode = {
    id: btnTxtId,
    name: 'Button Label',
    type: 'text',
    parent: btnId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 14, width: 408, height: 20, rotation: 0 },
    fills: solidFill('#ffffff'),
    strokes: [],
    effects: [],
    content: 'Send Message Now  →',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  };
  btnFrame.children!.push(btnTxtId);

  rootFrame.children!.push(h1Id, subId, l1Id, b1Id, l2Id, b2Id, l3Id, b3Id, chkBoxId, chkLblId, btnId);
  nodes.push(rootFrame, h1Node, subNode, l1Node, b1Frame, p1Node, l2Node, b2Frame, p2Node, l3Node, b3Frame, p3Node, chkBox, chkTxt, chkLblNode, btnFrame, btnTxt);

  return { title: 'Contact & Inquiry Form', nodes, rootFrameId: rootId, width: rootWidth, height: rootHeight };
}

// 5. Native Mobile App Screen (Text Prompt Driven)
export function generateMobileAppScreen(
  originX: number,
  originY: number,
  theme: ThemeColors,
  promptText?: string
): GeneratedDesignResult {
  const rootId = createId('frm_mob_screen');
  const nodes: SceneNode[] = [];
  const rootWidth = 390;
  const rootHeight = 844;

  const title = formatPromptTitle(promptText || 'Mobile App Explorer', 'Mobile App Screen');

  const rootFrame: FrameNode = {
    id: rootId,
    name: `Mobile - ${title}`,
    type: 'frame',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: originX, y: originY, width: rootWidth, height: rootHeight, rotation: 0 },
    fills: solidFill(theme.bg),
    strokes: solidStroke(theme.border, 2),
    effects: dropShadow(24, 0.2, 10),
    cornerRadius: 44,
    clipContent: true,
    children: [],
  };

  // Status Bar
  const timeId = createId('txt_mob_time');
  const timeNode: TextNode = {
    id: timeId,
    name: 'Time',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 32, y: 16, width: 60, height: 18, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: '9:41',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: 'bold',
  };

  // Header Title
  const headerId = createId('txt_mob_h');
  const headerNode: TextNode = {
    id: headerId,
    name: 'Header Greeting',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 24, y: 52, width: 342, height: 28, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: title,
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: 'bold',
  };

  // Search Bar Frame
  const searchBarId = createId('frm_search');
  const searchBar: FrameNode = {
    id: searchBarId,
    name: 'Search Bar',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 20, y: 92, width: 350, height: 44, rotation: 0 },
    fills: solidFill(theme.cardBg),
    strokes: solidStroke(theme.border),
    effects: [],
    cornerRadius: 12,
    clipContent: true,
    children: [],
  };
  const searchTxtId = createId('txt_search_ph');
  const searchTxt: TextNode = {
    id: searchTxtId,
    name: 'Placeholder',
    type: 'text',
    parent: searchBarId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 14, y: 13, width: 320, height: 18, rotation: 0 },
    fills: solidFill(theme.textMuted),
    strokes: [],
    effects: [],
    content: '🔍  Search templates, assets, layers...',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 'normal',
  };
  searchBar.children!.push(searchTxtId);

  // Featured Carousel Card
  const featCardId = createId('frm_feat_card');
  const featCard: FrameNode = {
    id: featCardId,
    name: 'Hero Promotional Card',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 20, y: 152, width: 350, height: 180, rotation: 0 },
    fills: solidFill(theme.cardBgElevated),
    strokes: solidStroke(theme.accent, 1),
    effects: dropShadow(14, 0.2, 5),
    cornerRadius: 20,
    clipContent: true,
    children: [],
  };
  const fBadgeId = createId('txt_f_badge');
  const fBadge: TextNode = {
    id: fBadgeId,
    name: 'Badge',
    type: 'text',
    parent: featCardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 18, y: 18, width: 200, height: 18, rotation: 0 },
    fills: solidFill(theme.accent),
    strokes: [],
    effects: [],
    content: '✨ FEATURED COMPONENT',
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: 'bold',
  };
  const fTitleId = createId('txt_f_title');
  const fTitle: TextNode = {
    id: fTitleId,
    name: 'Card Title',
    type: 'text',
    parent: featCardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 18, y: 44, width: 314, height: 48, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: `Instant ${title} Built with Smart Vectors`,
    fontFamily: 'Inter',
    fontSize: 17,
    fontWeight: 'bold',
    lineHeight: 22,
  };
  const fBtnId = createId('frm_f_btn');
  const fBtn: FrameNode = {
    id: fBtnId,
    name: 'Explore Button',
    type: 'frame',
    parent: featCardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 18, y: 116, width: 130, height: 38, rotation: 0 },
    fills: solidFill(theme.accent),
    strokes: [],
    effects: [],
    cornerRadius: 10,
    clipContent: true,
    children: [],
  };
  const fBtnTxtId = createId('txt_f_btxt');
  const fBtnTxt: TextNode = {
    id: fBtnTxtId,
    name: 'Label',
    type: 'text',
    parent: fBtnId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 10, width: 130, height: 18, rotation: 0 },
    fills: solidFill('#ffffff'),
    strokes: [],
    effects: [],
    content: 'View Details  →',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  };
  fBtn.children!.push(fBtnTxtId);
  featCard.children!.push(fBadgeId, fTitleId, fBtnId);

  // Category Pills
  const cats = ['Overview', 'Analytics', 'Components', 'Settings'];
  const catPillIds: string[] = [];
  cats.forEach((c, ci) => {
    const cpId = createId(`frm_cp_${ci}`);
    const cp: FrameNode = {
      id: cpId,
      name: `Category ${c}`,
      type: 'frame',
      parent: rootId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 20 + ci * 88, y: 350, width: 82, height: 32, rotation: 0 },
      fills: solidFill(ci === 0 ? theme.accent : theme.cardBg),
      strokes: solidStroke(ci === 0 ? theme.accent : theme.border),
      effects: [],
      cornerRadius: 16,
      clipContent: true,
      children: [],
    };
    const cpTxtId = createId(`txt_cp_${ci}`);
    const cpTxt: TextNode = {
      id: cpTxtId,
      name: 'Cat Label',
      type: 'text',
      parent: cpId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 0, y: 8, width: 82, height: 16, rotation: 0 },
      fills: solidFill(ci === 0 ? '#ffffff' : theme.textSecondary),
      strokes: [],
      effects: [],
      content: c,
      fontFamily: 'Inter',
      fontSize: 11,
      fontWeight: ci === 0 ? 'bold' : 'normal',
      textAlign: 'center',
    };
    cp.children!.push(cpTxtId);
    catPillIds.push(cpId);
    nodes.push(cp, cpTxt);
  });

  // Recent Activity Items
  const items = [
    { title: 'Vector Export Ready', sub: 'SVG, PDF & Web layers available', time: 'Just now' },
    { title: 'Responsive Constraints', sub: 'Pinned bounds across viewports', time: '2m ago' },
  ];
  const itemIds: string[] = [];
  items.forEach((it, ii) => {
    const itFrameId = createId(`frm_it_${ii}`);
    const itFrame: FrameNode = {
      id: itFrameId,
      name: `Row ${it.title}`,
      type: 'frame',
      parent: rootId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 20, y: 400 + ii * 80, width: 350, height: 68, rotation: 0 },
      fills: solidFill(theme.cardBg),
      strokes: solidStroke(theme.border),
      effects: [],
      cornerRadius: 14,
      clipContent: true,
      children: [],
    };
    const itTId = createId(`txt_itt_${ii}`);
    const itT: TextNode = {
      id: itTId,
      name: 'Item Title',
      type: 'text',
      parent: itFrameId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 18, y: 14, width: 220, height: 20, rotation: 0 },
      fills: solidFill(theme.textPrimary),
      strokes: [],
      effects: [],
      content: it.title,
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: 'bold',
    };
    const itSId = createId(`txt_its_${ii}`);
    const itS: TextNode = {
      id: itSId,
      name: 'Item Subtitle',
      type: 'text',
      parent: itFrameId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 18, y: 36, width: 220, height: 18, rotation: 0 },
      fills: solidFill(theme.textSecondary),
      strokes: [],
      effects: [],
      content: it.sub,
      fontFamily: 'Inter',
      fontSize: 11,
      fontWeight: 'normal',
    };
    const itTimeId = createId(`txt_itime_${ii}`);
    const itTime: TextNode = {
      id: itTimeId,
      name: 'Timestamp',
      type: 'text',
      parent: itFrameId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 240, y: 24, width: 92, height: 18, rotation: 0 },
      fills: solidFill(theme.accent),
      strokes: [],
      effects: [],
      content: it.time,
      fontFamily: 'Inter',
      fontSize: 11,
      fontWeight: '600',
      textAlign: 'right',
    };
    itFrame.children!.push(itTId, itSId, itTimeId);
    itemIds.push(itFrameId);
    nodes.push(itFrame, itT, itS, itTime);
  });

  // Bottom Navigation Bar
  const bottomNavId = createId('frm_mob_bottom');
  const bottomNav: FrameNode = {
    id: bottomNavId,
    name: 'Bottom Navigation',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 20, y: 760, width: 350, height: 56, rotation: 0 },
    fills: solidFill(theme.cardBgElevated),
    strokes: solidStroke(theme.border),
    effects: dropShadow(12, 0.15, 4),
    cornerRadius: 28,
    clipContent: true,
    children: [],
  };
  const navTabs = ['Home', 'Discover', 'Saved', 'Account'];
  const tabIds: string[] = [];
  navTabs.forEach((tab, ti) => {
    const tabId = createId(`txt_navtab_${ti}`);
    const tabNode: TextNode = {
      id: tabId,
      name: `Tab ${tab}`,
      type: 'text',
      parent: bottomNavId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: ti * 87.5, y: 18, width: 87.5, height: 20, rotation: 0 },
      fills: solidFill(ti === 0 ? theme.accent : theme.textMuted),
      strokes: [],
      effects: [],
      content: tab,
      fontFamily: 'Inter',
      fontSize: 11,
      fontWeight: ti === 0 ? 'bold' : 'normal',
      textAlign: 'center',
    };
    tabIds.push(tabId);
    nodes.push(tabNode);
  });
  bottomNav.children!.push(...tabIds);

  rootFrame.children!.push(timeId, headerId, searchBarId, featCardId, ...catPillIds, ...itemIds, bottomNavId);
  nodes.push(rootFrame, timeNode, headerNode, searchBar, searchTxt, featCard, fBadge, fTitle, fBtn, fBtnTxt, bottomNav);

  return { title: 'Mobile App Layout', nodes, rootFrameId: rootId, width: rootWidth, height: rootHeight };
}

// 6. Universal Bespoke UI Card Generator for ANY custom prompt
export function generateUniversalCard(
  originX: number,
  originY: number,
  theme: ThemeColors,
  promptText: string
): GeneratedDesignResult {
  const rootId = createId('frm_univ');
  const nodes: SceneNode[] = [];
  const rootWidth = 520;
  const rootHeight = 580;

  const title = formatPromptTitle(promptText, 'Custom Vector Component');

  const rootFrame: FrameNode = {
    id: rootId,
    name: `Component - ${title}`,
    type: 'frame',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: originX, y: originY, width: rootWidth, height: rootHeight, rotation: 0 },
    fills: solidFill(theme.bg),
    strokes: solidStroke(theme.border),
    effects: dropShadow(20, 0.15, 8),
    cornerRadius: 24,
    clipContent: true,
    children: [],
  };

  // Badge Frame
  const badgeId = createId('frm_u_badge');
  const badgeFrame: FrameNode = {
    id: badgeId,
    name: 'Component Badge',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 36, y: 36, width: 180, height: 28, rotation: 0 },
    fills: solidFill(theme.accent, 0.15),
    strokes: solidStroke(theme.accent, 1),
    effects: [],
    cornerRadius: 14,
    clipContent: true,
    children: [],
  };
  const badgeTxtId = createId('txt_u_badge_lbl');
  const badgeTxt: TextNode = {
    id: badgeTxtId,
    name: 'Badge Text',
    type: 'text',
    parent: badgeId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 6, width: 180, height: 16, rotation: 0 },
    fills: solidFill(theme.accent),
    strokes: [],
    effects: [],
    content: '✨ AI SYNTHESIZED UI',
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  };
  badgeFrame.children!.push(badgeTxtId);

  // Title
  const titleId = createId('txt_u_title');
  const titleNode: TextNode = {
    id: titleId,
    name: 'Component Header',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 36, y: 76, width: 448, height: 32, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: title,
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: 'bold',
  };

  // Subtitle
  const subId = createId('txt_u_sub');
  const subNode: TextNode = {
    id: subId,
    name: 'Subtitle',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 36, y: 114, width: 448, height: 22, rotation: 0 },
    fills: solidFill(theme.textSecondary),
    strokes: [],
    effects: [],
    content: 'Custom interactive Figma vector component synthesized from your instructions.',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: 'normal',
  };

  // Feature Card Inside
  const cardId = createId('frm_u_card');
  const cardFrame: FrameNode = {
    id: cardId,
    name: 'Main Content Container',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 36, y: 152, width: 448, height: 280, rotation: 0 },
    fills: solidFill(theme.cardBg),
    strokes: solidStroke(theme.border),
    effects: dropShadow(10, 0.1, 4),
    cornerRadius: 18,
    clipContent: true,
    children: [],
  };

  // 3 Detail Rows
  const details = [
    { label: 'Active Layout Spec', val: 'Responsive Vector Auto-Frame' },
    { label: 'Color Token Harmony', val: 'Synchronized Palette Tokens' },
    { label: 'Production Status', val: 'Ready for Export & Prototype' },
  ];
  const detailIds: string[] = [];
  details.forEach((d, di) => {
    const rowId = createId(`txt_row_${di}`);
    const rowNode: TextNode = {
      id: rowId,
      name: `Detail Row ${di + 1}`,
      type: 'text',
      parent: cardId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 20, y: 24 + di * 54, width: 408, height: 20, rotation: 0 },
      fills: solidFill(theme.textPrimary),
      strokes: [],
      effects: [],
      content: `●  ${d.label}:  ${d.val}`,
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '500',
    };
    detailIds.push(rowId);
    nodes.push(rowNode);
  });

  // KPI Mini Badges
  const pill1Id = createId('frm_pill_1');
  const pill1: FrameNode = {
    id: pill1Id,
    name: 'Metric Pill 1',
    type: 'frame',
    parent: cardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 20, y: 200, width: 194, height: 56, rotation: 0 },
    fills: solidFill(theme.cardBgElevated),
    strokes: solidStroke(theme.border),
    effects: [],
    cornerRadius: 12,
    clipContent: true,
    children: [],
  };
  const pill1TxtId = createId('txt_p1');
  const pill1Txt: TextNode = {
    id: pill1TxtId,
    name: 'Pill Label',
    type: 'text',
    parent: pill1Id,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 12, y: 18, width: 170, height: 20, rotation: 0 },
    fills: solidFill(theme.accent),
    strokes: [],
    effects: [],
    content: '⚡ Fidelity: 99.8%',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 'bold',
  };
  pill1.children!.push(pill1TxtId);

  const pill2Id = createId('frm_pill_2');
  const pill2: FrameNode = {
    id: pill2Id,
    name: 'Metric Pill 2',
    type: 'frame',
    parent: cardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 234, y: 200, width: 194, height: 56, rotation: 0 },
    fills: solidFill(theme.cardBgElevated),
    strokes: solidStroke(theme.border),
    effects: [],
    cornerRadius: 12,
    clipContent: true,
    children: [],
  };
  const pill2TxtId = createId('txt_p2');
  const pill2Txt: TextNode = {
    id: pill2TxtId,
    name: 'Pill Label',
    type: 'text',
    parent: pill2Id,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 12, y: 18, width: 170, height: 20, rotation: 0 },
    fills: solidFill('#10b981'),
    strokes: [],
    effects: [],
    content: '✓ 100% Vectorized',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 'bold',
  };
  pill2.children!.push(pill2TxtId);

  cardFrame.children!.push(...detailIds, pill1Id, pill2Id);

  // Bottom Action Button
  const btnId = createId('btn_u_act');
  const btnFrame: FrameNode = {
    id: btnId,
    name: 'Primary Action Button',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 36, y: 456, width: 448, height: 50, rotation: 0 },
    fills: solidFill(theme.accent),
    strokes: [],
    effects: dropShadow(12, 0.25, 4),
    cornerRadius: 14,
    clipContent: true,
    children: [],
  };
  const btnTxtId = createId('txt_u_btn');
  const btnTxt: TextNode = {
    id: btnTxtId,
    name: 'Button Label',
    type: 'text',
    parent: btnId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 15, width: 448, height: 20, rotation: 0 },
    fills: solidFill('#ffffff'),
    strokes: [],
    effects: [],
    content: `Explore ${title.length > 22 ? title.slice(0, 20) + '...' : title}  →`,
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  };
  btnFrame.children!.push(btnTxtId);

  rootFrame.children!.push(badgeId, titleId, subId, cardId, btnId);
  nodes.push(rootFrame, badgeFrame, badgeTxt, titleNode, subNode, cardFrame, pill1, pill1Txt, pill2, pill2Txt, btnFrame, btnTxt);

  return { title, nodes, rootFrameId: rootId, width: rootWidth, height: rootHeight };
}

// Original code commented out per guidelines:
// // Master Dispatcher: Analyzes prompt and returns appropriate generated design
// export async function generateDesignFromPrompt(
//   prompt: string,
//   themeKey: DesignTheme = 'dark',
//   originX: number = 100,
//   originY: number = 100
// ): Promise<GeneratedDesignResult> {
//   const theme = themeKey !== 'auto' && THEMES[themeKey] ? THEMES[themeKey] : THEMES.dark;
//   const p = prompt.toLowerCase();
//
//   let result: GeneratedDesignResult;
//
//   // Intelligent Pattern Matching for diverse design requirements
//   if (
//     p.includes('mobile') ||
//     p.includes('phone') ||
//     p.includes('ios') ||
//     p.includes('android') ||
//     p.includes('app screen')
//   ) {
//     result = generateMobileAppScreen(originX, originY, theme, prompt);
//   } else if (
//     p.includes('product') ||
//     p.includes('ecommerce') ||

// Generate UNC "What Is My IP" Network Diagnostics Web Portal
export function generateNetworkDiagnosticsPortal(
  originX: number,
  originY: number,
  theme: ThemeColors,
  promptText: string = '',
  referenceImageSrc?: string
): GeneratedDesignResult {
  const rootId = createId('frm_net_portal');
  const nodes: SceneNode[] = [];
  const rootWidth = 1200;
  const rootHeight = 1440;

  // Root Canvas Frame
  const rootFrame: FrameNode = {
    id: rootId,
    name: 'What Is My IP - Network Diagnostics',
    type: 'frame',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: originX, y: originY, width: rootWidth, height: rootHeight, rotation: 0 },
    fills: solidFill(theme.bg),
    strokes: solidStroke(theme.border),
    effects: dropShadow(24, 0.15, 8),
    cornerRadius: 16,
    clipContent: true,
    children: [],
  };

  // Nav Bar Background
  const isLightTheme = theme.textPrimary === '#0f172a';
  const navBg = isLightTheme ? '#14294b' : theme.cardBgElevated;
  const footerBg = isLightTheme ? '#0f1f38' : theme.bg === '#09090b' ? '#040407' : theme.cardBg;

  // 1. TOP HEADER
  const headerId = createId('frm_top_header');
  const headerFrame: FrameNode = {
    id: headerId,
    name: 'Top Header',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 16, width: rootWidth, height: 80, rotation: 0 },
    fills: [],
    strokes: [],
    effects: [],
    cornerRadius: 0,
    clipContent: false,
    children: [],
  };

  // Laptop / question icon frame
  const iconBoxId = createId('frm_hdr_icon');
  const iconBox: FrameNode = {
    id: iconBoxId,
    name: 'Portal Icon',
    type: 'frame',
    parent: headerId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 440, y: 4, width: 44, height: 38, rotation: 0 },
    fills: solidFill(theme.accent, 0.12),
    strokes: solidStroke(theme.accent, 1.5),
    effects: [],
    cornerRadius: 8,
    clipContent: true,
    children: [],
  };
  const iconTxtId = createId('txt_hdr_icon');
  const iconTxt: TextNode = {
    id: iconTxtId,
    name: 'Icon Glyph',
    type: 'text',
    parent: iconBoxId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 8, width: 44, height: 22, rotation: 0 },
    fills: solidFill(theme.accent),
    strokes: [],
    effects: [],
    content: '💻',
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  };
  iconBox.children!.push(iconTxtId);

  // Header Title
  const titleId = createId('txt_hdr_title');
  const titleNode: TextNode = {
    id: titleId,
    name: 'Portal Title',
    type: 'text',
    parent: headerId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 494, y: 8, width: 260, height: 34, rotation: 0 },
    fills: solidFill(isLightTheme ? '#258bd2' : theme.textPrimary),
    strokes: [],
    effects: [],
    content: 'What Is My IP?',
    fontFamily: 'Inter',
    fontSize: 26,
    fontWeight: 'bold',
  };

  // Header Subtitle
  const subId = createId('txt_hdr_sub');
  const subNode: TextNode = {
    id: subId,
    name: 'Portal Subtitle',
    type: 'text',
    parent: headerId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 200, y: 48, width: 800, height: 20, rotation: 0 },
    fills: solidFill(theme.textMuted),
    strokes: [],
    effects: [],
    content: 'Network diagnostics - UNC Information Technology Services',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 'normal',
    textAlign: 'center',
  };

  // Theme switch button
  const themeBtnId = createId('txt_theme_btn');
  const themeBtn: TextNode = {
    id: themeBtnId,
    name: 'Theme Switch',
    type: 'text',
    parent: headerId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 1080, y: 16, width: 24, height: 24, rotation: 0 },
    fills: solidFill(theme.textSecondary),
    strokes: [],
    effects: [],
    content: '◐',
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: 'normal',
    textAlign: 'center',
  };

  headerFrame.children!.push(iconBoxId, titleId, subId, themeBtnId);
  nodes.push(headerFrame, iconBox, iconTxt, titleNode, subNode, themeBtn);

  // 2. NAV BAR
  const navId = createId('frm_nav_bar');
  const navFrame: FrameNode = {
    id: navId,
    name: 'Navigation Bar',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 96, width: rootWidth, height: 40, rotation: 0 },
    fills: solidFill(navBg),
    strokes: [],
    effects: [],
    cornerRadius: 0,
    clipContent: true,
    children: [],
  };

  const navItems = ['HOME', 'SPEED TEST', 'CONNECTIVITY', 'DNS LOOKUP', 'FAQ', 'ABOUT'];
  const navItemIds: string[] = [];
  const navSpacing = 130;
  navItems.forEach((label, idx) => {
    const itmId = createId(`nav_item_${idx}`);
    const itmNode: TextNode = {
      id: itmId,
      name: `Nav - ${label}`,
      type: 'text',
      parent: navId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 160 + idx * navSpacing, y: 12, width: 120, height: 20, rotation: 0 },
      fills: solidFill(idx === 0 ? '#ffffff' : isLightTheme ? '#cbd5e1' : theme.textSecondary),
      strokes: [],
      effects: [],
      content: label,
      fontFamily: 'Inter',
      fontSize: 11,
      fontWeight: idx === 0 ? 'bold' : '600',
    };
    navItemIds.push(itmId);
    nodes.push(itmNode);
  });
  navFrame.children!.push(...navItemIds);
  nodes.push(navFrame);

  // 3. NOTICE & PRINT REPORT BAR
  const noticeId = createId('txt_notice');
  const noticeNode: TextNode = {
    id: noticeId,
    name: 'Notice Banner',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 100, y: 154, width: 600, height: 22, rotation: 0 },
    fills: solidFill(theme.textSecondary),
    strokes: [],
    effects: [],
    content: '🌐  You are connected from off campus over the Internet.',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '500',
  };

  const printBtnId = createId('frm_print_btn');
  const printBtn: FrameNode = {
    id: printBtnId,
    name: 'Print Report Button',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 940, y: 148, width: 160, height: 32, rotation: 0 },
    fills: solidFill(theme.accent),
    strokes: [],
    effects: dropShadow(6, 0.1, 2),
    cornerRadius: 6,
    clipContent: true,
    children: [],
  };
  const printTxtId = createId('txt_print_lbl');
  const printTxt: TextNode = {
    id: printTxtId,
    name: 'Label',
    type: 'text',
    parent: printBtnId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 8, width: 160, height: 18, rotation: 0 },
    fills: solidFill('#ffffff'),
    strokes: [],
    effects: [],
    content: '🖨  PRINT REPORT (PDF)',
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  };
  printBtn.children!.push(printTxtId);
  nodes.push(noticeNode, printBtn, printTxt);

  // 4. IP BANNER (LEFT) & MAP CARD (RIGHT)
  const ipBannerId = createId('frm_ip_banner');
  const ipBanner: FrameNode = {
    id: ipBannerId,
    name: 'IPv4 Address Banner',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 100, y: 196, width: 620, height: 140, rotation: 0 },
    fills: solidFill(theme.accent),
    strokes: solidStroke(theme.border, 1),
    effects: dropShadow(16, 0.2, 6),
    cornerRadius: 12,
    clipContent: true,
    children: [],
  };

  // Badge: IPv4
  const ipv4BadgeId = createId('frm_ipv4_badge');
  const ipv4Badge: FrameNode = {
    id: ipv4BadgeId,
    name: 'IPv4 Tag',
    type: 'frame',
    parent: ipBannerId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 24, y: 22, width: 44, height: 22, rotation: 0 },
    fills: solidFill('rgba(0,0,0,0.3)'),
    strokes: [],
    effects: [],
    cornerRadius: 4,
    clipContent: true,
    children: [],
  };
  const ipv4BadgeTxtId = createId('txt_ipv4_badge');
  const ipv4BadgeTxt: TextNode = {
    id: ipv4BadgeTxtId,
    name: 'Badge Label',
    type: 'text',
    parent: ipv4BadgeId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 3, width: 44, height: 16, rotation: 0 },
    fills: solidFill('#ffffff'),
    strokes: [],
    effects: [],
    content: 'IPv4',
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  };
  ipv4Badge.children!.push(ipv4BadgeTxtId);

  // Big IP Text
  const ipValId = createId('txt_ip_val');
  const ipValNode: TextNode = {
    id: ipValId,
    name: 'IP Display',
    type: 'text',
    parent: ipBannerId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 80, y: 44, width: 460, height: 48, rotation: 0 },
    fills: solidFill('#ffffff'),
    strokes: [],
    effects: [],
    content: '122.163.126.188',
    fontFamily: 'Inter',
    fontSize: 34,
    fontWeight: 'bold',
    textAlign: 'center',
  };

  // Copy Icon Frame
  const copyBtnId = createId('frm_copy_btn');
  const copyBtn: FrameNode = {
    id: copyBtnId,
    name: 'Copy Button',
    type: 'frame',
    parent: ipBannerId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 566, y: 52, width: 34, height: 34, rotation: 0 },
    fills: solidFill('rgba(255,255,255,0.18)'),
    strokes: [],
    effects: [],
    cornerRadius: 8,
    clipContent: true,
    children: [],
  };
  const copyTxtId = createId('txt_copy_icon');
  const copyTxt: TextNode = {
    id: copyTxtId,
    name: 'Icon',
    type: 'text',
    parent: copyBtnId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 7, width: 34, height: 20, rotation: 0 },
    fills: solidFill('#ffffff'),
    strokes: [],
    effects: [],
    content: '📋',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: 'normal',
    textAlign: 'center',
  };
  copyBtn.children!.push(copyTxtId);

  ipBanner.children!.push(ipv4BadgeId, ipValId, copyBtnId);
  nodes.push(ipBanner, ipv4Badge, ipv4BadgeTxt, ipValNode, copyBtn, copyTxt);

  // Right: Map Card
  const mapCardId = createId('frm_map_card');
  const mapCard: FrameNode = {
    id: mapCardId,
    name: 'Location Map Card',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 740, y: 196, width: 360, height: 176, rotation: 0 },
    fills: solidFill(theme.cardBg),
    strokes: solidStroke(theme.border),
    effects: dropShadow(12, 0.1, 4),
    cornerRadius: 12,
    clipContent: true,
    children: [],
  };

  // Map visual body
  const mapBodyId = createId('frm_map_body');
  const mapBody: FrameNode = {
    id: mapBodyId,
    name: 'Map Viewport',
    type: 'frame',
    parent: mapCardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 0, width: 360, height: 136, rotation: 0 },
    fills: solidFill(isLightTheme ? '#e8ecef' : theme.cardBgElevated),
    strokes: [],
    effects: [],
    cornerRadius: 0,
    clipContent: true,
    children: [],
  };

  // Water river line in map
  const riverId = createId('shp_river');
  const riverNode: ShapeNode = {
    id: riverId,
    name: 'River Graphic',
    type: 'rect',
    parent: mapBodyId,
    visible: true,
    locked: false,
    opacity: 0.6,
    transform: { x: 120, y: 0, width: 44, height: 136, rotation: -18 },
    fills: solidFill('#38bdf8'),
    strokes: [],
    effects: [],
  };

  // Pin Marker
  const pinId = createId('txt_pin_marker');
  const pinNode: TextNode = {
    id: pinId,
    name: 'Location Marker',
    type: 'text',
    parent: mapBodyId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 160, y: 38, width: 140, height: 32, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: '📍 Kolkata',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: 'bold',
  };

  // Attribution
  const osmId = createId('txt_osm_attrib');
  const osmNode: TextNode = {
    id: osmId,
    name: 'Attribution',
    type: 'text',
    parent: mapBodyId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 10, y: 114, width: 340, height: 16, rotation: 0 },
    fills: solidFill(theme.textMuted),
    strokes: [],
    effects: [],
    content: 'Leaflet | © OpenStreetMap contributors',
    fontFamily: 'Inter',
    fontSize: 9,
    fontWeight: 'normal',
    textAlign: 'right',
  };

  mapBody.children!.push(riverId, pinId, osmId);

  // Map footer text
  const mapFootId = createId('txt_map_foot');
  const mapFoot: TextNode = {
    id: mapFootId,
    name: 'Map Location Footnote',
    type: 'text',
    parent: mapCardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 146, width: 360, height: 20, rotation: 0 },
    fills: solidFill(theme.textSecondary),
    strokes: [],
    effects: [],
    content: 'Approximate IP location: Kolkata',
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  };

  mapCard.children!.push(mapBodyId, mapFootId);
  nodes.push(mapCard, mapBody, riverNode, pinNode, osmNode, mapFoot);

  // 5. MIDDLE ROW: CAMPUS CONNECTIVITY (LEFT) & IPV4 ADDRESS DETAILS (RIGHT)
  const connCardId = createId('frm_conn_card');
  const connCard: FrameNode = {
    id: connCardId,
    name: 'Campus Connectivity Card',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 100, y: 396, width: 280, height: 380, rotation: 0 },
    fills: solidFill(theme.cardBg),
    strokes: solidStroke(theme.border),
    effects: dropShadow(10, 0.08, 3),
    cornerRadius: 12,
    clipContent: true,
    children: [],
  };

  const connHdrId = createId('txt_conn_hdr');
  const connHdr: TextNode = {
    id: connHdrId,
    name: 'Card Header',
    type: 'text',
    parent: connCardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 20, y: 20, width: 240, height: 22, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: '📶  Campus Connectivity',
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: 'bold',
  };

  // Tabs: Default / IPv4
  const tabDefaultId = createId('frm_tab_def');
  const tabDefault: FrameNode = {
    id: tabDefaultId,
    name: 'Tab Default',
    type: 'frame',
    parent: connCardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 20, y: 52, width: 62, height: 24, rotation: 0 },
    fills: solidFill(isLightTheme ? '#4b5563' : theme.cardBgElevated),
    strokes: [],
    effects: [],
    cornerRadius: 4,
    clipContent: true,
    children: [],
  };
  const tabDefTxtId = createId('txt_tab_def');
  const tabDefTxt: TextNode = {
    id: tabDefTxtId,
    name: 'Label',
    type: 'text',
    parent: tabDefaultId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 4, width: 62, height: 16, rotation: 0 },
    fills: solidFill('#ffffff'),
    strokes: [],
    effects: [],
    content: 'Default',
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  };
  tabDefault.children!.push(tabDefTxtId);

  const tabIpv4Id = createId('frm_tab_ipv4');
  const tabIpv4: FrameNode = {
    id: tabIpv4Id,
    name: 'Tab IPv4',
    type: 'frame',
    parent: connCardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 88, y: 52, width: 50, height: 24, rotation: 0 },
    fills: solidFill(theme.cardBgElevated),
    strokes: solidStroke(theme.border),
    effects: [],
    cornerRadius: 4,
    clipContent: true,
    children: [],
  };
  const tabIpv4TxtId = createId('txt_tab_ipv4');
  const tabIpv4Txt: TextNode = {
    id: tabIpv4TxtId,
    name: 'Label',
    type: 'text',
    parent: tabIpv4Id,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 4, width: 50, height: 16, rotation: 0 },
    fills: solidFill(theme.textSecondary),
    strokes: [],
    effects: [],
    content: 'IPv4',
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: 'normal',
    textAlign: 'center',
  };
  tabIpv4.children!.push(tabIpv4TxtId);

  // Status Rows
  const row1TxtId = createId('txt_r1_lbl');
  const row1Txt: TextNode = {
    id: row1TxtId,
    name: 'IPv4 Label',
    type: 'text',
    parent: connCardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 20, y: 92, width: 60, height: 20, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: 'IPv4',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 'bold',
  };
  const row1BadgeId = createId('frm_r1_badge');
  const row1Badge: FrameNode = {
    id: row1BadgeId,
    name: 'Badge Supported',
    type: 'frame',
    parent: connCardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 140, y: 90, width: 118, height: 24, rotation: 0 },
    fills: solidFill('#ecfdf5'),
    strokes: solidStroke('#a7f3d0'),
    effects: [],
    cornerRadius: 12,
    clipContent: true,
    children: [],
  };
  const row1BadgeTxtId = createId('txt_r1_badge');
  const row1BadgeTxt: TextNode = {
    id: row1BadgeTxtId,
    name: 'Badge Label',
    type: 'text',
    parent: row1BadgeId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 4, width: 118, height: 16, rotation: 0 },
    fills: solidFill('#059669'),
    strokes: [],
    effects: [],
    content: '✔  Supported',
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  };
  row1Badge.children!.push(row1BadgeTxtId);

  // IPv6 Not Supported
  const row2TxtId = createId('txt_r2_lbl');
  const row2Txt: TextNode = {
    id: row2TxtId,
    name: 'IPv6 Label',
    type: 'text',
    parent: connCardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 20, y: 130, width: 60, height: 20, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: 'IPv6',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 'bold',
  };
  const row2BadgeId = createId('frm_r2_badge');
  const row2Badge: FrameNode = {
    id: row2BadgeId,
    name: 'Badge Not Supported',
    type: 'frame',
    parent: connCardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 130, y: 128, width: 128, height: 24, rotation: 0 },
    fills: solidFill('#fffbeb'),
    strokes: solidStroke('#fde68a'),
    effects: [],
    cornerRadius: 12,
    clipContent: true,
    children: [],
  };
  const row2BadgeTxtId = createId('txt_r2_badge');
  const row2BadgeTxt: TextNode = {
    id: row2BadgeTxtId,
    name: 'Badge Label',
    type: 'text',
    parent: row2BadgeId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 4, width: 128, height: 16, rotation: 0 },
    fills: solidFill('#d97706'),
    strokes: [],
    effects: [],
    content: '⚠  Not supported',
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  };
  row2Badge.children!.push(row2BadgeTxtId);

  // Campus DNS Security
  const row3TxtId = createId('txt_r3_lbl');
  const row3Txt: TextNode = {
    id: row3TxtId,
    name: 'DNS Security Label',
    type: 'text',
    parent: connCardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 20, y: 168, width: 200, height: 18, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: 'Campus DNS Security',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 'bold',
  };
  const row3BadgeTxtId = createId('txt_r3_badge');
  const row3BadgeTxt: TextNode = {
    id: row3BadgeTxtId,
    name: 'Status Inactive',
    type: 'text',
    parent: connCardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 20, y: 190, width: 120, height: 18, rotation: 0 },
    fills: solidFill('#ea580c'),
    strokes: [],
    effects: [],
    content: '⚠  Inactive',
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '600',
  };

  // Divider
  const div1Id = createId('shp_div_1');
  const div1: ShapeNode = {
    id: div1Id,
    name: 'Divider Line',
    type: 'rect',
    parent: connCardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 20, y: 220, width: 240, height: 1, rotation: 0 },
    fills: solidFill(theme.border),
    strokes: [],
    effects: [],
  };

  // Internet DNS Provider Details
  const dnsProvHdrId = createId('txt_dns_hdr');
  const dnsProvHdr: TextNode = {
    id: dnsProvHdrId,
    name: 'DNS Provider Header',
    type: 'text',
    parent: connCardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 20, y: 232, width: 240, height: 18, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: 'Internet DNS Provider',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 'bold',
  };
  const dnsProvNameId = createId('txt_dns_name');
  const dnsProvName: TextNode = {
    id: dnsProvNameId,
    name: 'ISP Name',
    type: 'text',
    parent: connCardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 20, y: 254, width: 240, height: 18, rotation: 0 },
    fills: solidFill(theme.textSecondary),
    strokes: [],
    effects: [],
    content: 'Bharti Airtel Limited',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 'normal',
  };
  const dnsProvLocId = createId('txt_dns_loc');
  const dnsProvLoc: TextNode = {
    id: dnsProvLocId,
    name: 'Country',
    type: 'text',
    parent: connCardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 20, y: 274, width: 240, height: 18, rotation: 0 },
    fills: solidFill(theme.textMuted),
    strokes: [],
    effects: [],
    content: 'India',
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: 'normal',
  };
  const dnsProvIpId = createId('txt_dns_ip');
  const dnsProvIp: TextNode = {
    id: dnsProvIpId,
    name: 'Resolver IP',
    type: 'text',
    parent: connCardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 20, y: 296, width: 240, height: 18, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: '59.145.238.78',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 'bold',
  };

  connCard.children!.push(
    connHdrId,
    tabDefaultId,
    tabIpv4Id,
    row1TxtId,
    row1BadgeId,
    row2TxtId,
    row2BadgeId,
    row3TxtId,
    row3BadgeTxtId,
    div1Id,
    dnsProvHdrId,
    dnsProvNameId,
    dnsProvLocId,
    dnsProvIpId
  );
  nodes.push(
    connCard,
    connHdr,
    tabDefault,
    tabDefTxt,
    tabIpv4,
    tabIpv4Txt,
    row1Txt,
    row1Badge,
    row1BadgeTxt,
    row2Txt,
    row2Badge,
    row2BadgeTxt,
    row3Txt,
    row3BadgeTxt,
    div1,
    dnsProvHdr,
    dnsProvName,
    dnsProvLoc,
    dnsProvIp
  );

  // More Details Button below connectivity card
  const moreBtnId = createId('frm_more_btn');
  const moreBtn: FrameNode = {
    id: moreBtnId,
    name: 'More Details Button',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 100, y: 792, width: 140, height: 32, rotation: 0 },
    fills: solidFill(theme.accent),
    strokes: [],
    effects: dropShadow(6, 0.1, 2),
    cornerRadius: 6,
    clipContent: true,
    children: [],
  };
  const moreBtnTxtId = createId('txt_more_lbl');
  const moreBtnTxt: TextNode = {
    id: moreBtnTxtId,
    name: 'Label',
    type: 'text',
    parent: moreBtnId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 8, width: 140, height: 18, rotation: 0 },
    fills: solidFill('#ffffff'),
    strokes: [],
    effects: [],
    content: '▲  MORE DETAILS',
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  };
  moreBtn.children!.push(moreBtnTxtId);
  nodes.push(moreBtn, moreBtnTxt);

  // Right: IPv4 Address Details Table Card
  const tableCardId = createId('frm_table_card');
  const tableCard: FrameNode = {
    id: tableCardId,
    name: 'IPv4 Address Details Card',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 400, y: 396, width: 700, height: 380, rotation: 0 },
    fills: solidFill(theme.cardBg),
    strokes: solidStroke(theme.border),
    effects: dropShadow(10, 0.08, 3),
    cornerRadius: 12,
    clipContent: true,
    children: [],
  };

  const tableHdrId = createId('txt_tbl_hdr');
  const tableHdr: TextNode = {
    id: tableHdrId,
    name: 'Table Header',
    type: 'text',
    parent: tableCardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 24, y: 20, width: 400, height: 24, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: '🌐  IPv4 Address Details',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: 'bold',
  };
  tableCard.children!.push(tableHdrId);
  nodes.push(tableHdr);

  const tableRows = [
    { label: 'Address', value: '122.163.126.188', highlight: true },
    { label: 'Name', value: 'abts-north-dynamic-188.163.126.122.airtelbroadband.in', highlight: false },
    { label: 'ISP', value: 'Bharti Airtel Ltd.', highlight: false },
    { label: 'Org', value: 'BHARTI', highlight: false },
    { label: 'Location', value: 'Kolkata, West Bengal, India', highlight: false },
    { label: 'ASN', value: 'AS24560 Bharti Airtel Ltd., Telemedia Services', highlight: false },
  ];

  tableRows.forEach((r, idx) => {
    const yPos = 62 + idx * 52;
    const lblId = createId(`txt_row_${idx}_lbl`);
    const lblNode: TextNode = {
      id: lblId,
      name: `Row Label - ${r.label}`,
      type: 'text',
      parent: tableCardId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 24, y: yPos, width: 120, height: 20, rotation: 0 },
      fills: solidFill(theme.textMuted),
      strokes: [],
      effects: [],
      content: r.label,
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: 'bold',
    };
    const valId = createId(`txt_row_${idx}_val`);
    const valNode: TextNode = {
      id: valId,
      name: `Row Value - ${r.label}`,
      type: 'text',
      parent: tableCardId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 154, y: yPos, width: 520, height: 20, rotation: 0 },
      fills: solidFill(r.highlight ? theme.accent : theme.textPrimary),
      strokes: [],
      effects: [],
      content: r.value,
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: r.highlight ? 'bold' : 'normal',
    };
    const rowDivId = createId(`shp_div_r_${idx}`);
    const rowDiv: ShapeNode = {
      id: rowDivId,
      name: `Divider - ${r.label}`,
      type: 'rect',
      parent: tableCardId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 24, y: yPos + 38, width: 652, height: 1, rotation: 0 },
      fills: solidFill(theme.border),
      strokes: [],
      effects: [],
    };
    tableCard.children!.push(lblId, valId, rowDivId);
    nodes.push(lblNode, valNode, rowDiv);
  });
  nodes.push(tableCard);

  // 6. LOWER ROW: YOUR DEVICE (LEFT) & CAMPUS VPN (RIGHT)
  const devCardId = createId('frm_dev_card');
  const devCard: FrameNode = {
    id: devCardId,
    name: 'Your Device Card',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 100, y: 844, width: 490, height: 190, rotation: 0 },
    fills: solidFill(theme.cardBg),
    strokes: solidStroke(theme.border),
    effects: dropShadow(10, 0.08, 3),
    cornerRadius: 12,
    clipContent: true,
    children: [],
  };

  const devHdrId = createId('txt_dev_hdr');
  const devHdr: TextNode = {
    id: devHdrId,
    name: 'Card Header',
    type: 'text',
    parent: devCardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 24, y: 18, width: 300, height: 22, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: '💻  Your Device',
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: 'bold',
  };
  devCard.children!.push(devHdrId);
  nodes.push(devHdr);

  const devRows = [
    { label: 'Browser', value: 'Chrome 124.0.0' },
    { label: 'Operating System', value: 'Windows 10 / 11' },
    { label: 'Device Type', value: 'PC / Desktop' },
    { label: 'Clock', value: '✔  Synchronized' },
  ];
  devRows.forEach((r, idx) => {
    const yPos = 52 + idx * 32;
    const dLblId = createId(`txt_dev_${idx}_lbl`);
    const dLbl: TextNode = {
      id: dLblId,
      name: `Device - ${r.label}`,
      type: 'text',
      parent: devCardId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 24, y: yPos, width: 140, height: 18, rotation: 0 },
      fills: solidFill(theme.textMuted),
      strokes: [],
      effects: [],
      content: r.label,
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: '600',
    };
    const dValId = createId(`txt_dev_${idx}_val`);
    const dVal: TextNode = {
      id: dValId,
      name: `Device Val - ${r.label}`,
      type: 'text',
      parent: devCardId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 180, y: yPos, width: 280, height: 18, rotation: 0 },
      fills: solidFill(r.label === 'Clock' ? '#10b981' : theme.textPrimary),
      strokes: [],
      effects: [],
      content: r.value,
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: r.label === 'Clock' ? 'bold' : 'normal',
    };
    devCard.children!.push(dLblId, dValId);
    nodes.push(dLbl, dVal);
  });
  nodes.push(devCard);

  // Right: Campus VPN Card
  const vpnCardId = createId('frm_vpn_card');
  const vpnCard: FrameNode = {
    id: vpnCardId,
    name: 'Campus VPN Card',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 610, y: 844, width: 490, height: 190, rotation: 0 },
    fills: solidFill(theme.cardBg),
    strokes: solidStroke(theme.border),
    effects: dropShadow(10, 0.08, 3),
    cornerRadius: 12,
    clipContent: true,
    children: [],
  };

  const vpnHdrId = createId('txt_vpn_hdr');
  const vpnHdr: TextNode = {
    id: vpnHdrId,
    name: 'Card Header',
    type: 'text',
    parent: vpnCardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 24, y: 18, width: 300, height: 22, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: '🛡  Campus VPN',
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: 'bold',
  };

  const vpnDescId = createId('txt_vpn_desc');
  const vpnDesc: TextNode = {
    id: vpnDescId,
    name: 'Description',
    type: 'text',
    parent: vpnCardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 24, y: 52, width: 442, height: 36, rotation: 0 },
    fills: solidFill(theme.textSecondary),
    strokes: [],
    effects: [],
    content: 'Connect to the campus VPN to access restricted campus resources from off campus.',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 'normal',
  };

  const vpnBtnId = createId('frm_vpn_btn');
  const vpnBtn: FrameNode = {
    id: vpnBtnId,
    name: 'VPN CTA Button',
    type: 'frame',
    parent: vpnCardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 24, y: 110, width: 442, height: 42, rotation: 0 },
    fills: solidFill(theme.accent),
    strokes: [],
    effects: dropShadow(8, 0.12, 3),
    cornerRadius: 8,
    clipContent: true,
    children: [],
  };
  const vpnBtnTxtId = createId('txt_vpn_btn_lbl');
  const vpnBtnTxt: TextNode = {
    id: vpnBtnTxtId,
    name: 'Label',
    type: 'text',
    parent: vpnBtnId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 12, width: 442, height: 20, rotation: 0 },
    fills: solidFill('#ffffff'),
    strokes: [],
    effects: [],
    content: '📥  INSTALL CISCO SECURE CLIENT',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  };
  vpnBtn.children!.push(vpnBtnTxtId);

  vpnCard.children!.push(vpnHdrId, vpnDescId, vpnBtnId);
  nodes.push(vpnCard, vpnHdr, vpnDesc, vpnBtn, vpnBtnTxt);

  // 7. INFO CALLOUT BOX
  const infoBoxId = createId('frm_info_box');
  const infoBox: FrameNode = {
    id: infoBoxId,
    name: 'Information Callout',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 100, y: 1054, width: 1000, height: 188, rotation: 0 },
    fills: solidFill(isLightTheme ? '#e8f4fc' : theme.cardBgElevated),
    strokes: solidStroke(isLightTheme ? '#b9e0f7' : theme.border),
    effects: dropShadow(8, 0.05, 2),
    cornerRadius: 12,
    clipContent: true,
    children: [],
  };

  const infoHdrId = createId('txt_info_hdr');
  const infoHdr: TextNode = {
    id: infoHdrId,
    name: 'Callout Title',
    type: 'text',
    parent: infoBoxId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 24, y: 16, width: 400, height: 22, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: '❓  What does this tool show?',
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: 'bold',
  };

  const col1HdrId = createId('txt_c1_hdr');
  const col1Hdr: TextNode = {
    id: col1HdrId,
    name: 'Col 1 Header',
    type: 'text',
    parent: infoBoxId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 24, y: 46, width: 440, height: 16, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: 'All visitors see:',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 'bold',
  };

  const col1BodyId = createId('txt_c1_body');
  const col1Body: TextNode = {
    id: col1BodyId,
    name: 'Col 1 Items',
    type: 'text',
    parent: infoBoxId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 24, y: 68, width: 440, height: 60, rotation: 0 },
    fills: solidFill(theme.textSecondary),
    strokes: [],
    effects: [],
    content: '• IPv4 and IPv6 address detection\n• Internet Service Provider (ISP) and geolocation\n• Internet DNS provider and security status\n• IP geolocation map (city-level accuracy)',
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: 'normal',
  };

  const col2HdrId = createId('txt_c2_hdr');
  const col2Hdr: TextNode = {
    id: col2HdrId,
    name: 'Col 2 Header',
    type: 'text',
    parent: infoBoxId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 520, y: 46, width: 440, height: 16, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: 'Campus and VPN visitors also see:',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 'bold',
  };

  const col2BodyId = createId('txt_c2_body');
  const col2Body: TextNode = {
    id: col2BodyId,
    name: 'Col 2 Items',
    type: 'text',
    parent: infoBoxId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 520, y: 68, width: 440, height: 60, rotation: 0 },
    fills: solidFill(theme.textSecondary),
    strokes: [],
    effects: [],
    content: '• Campus network and VLAN assignment\n• Network Access Control (NAC) details\n• Wi-Fi connection details — SSID & AP signal\n• Building location map (street-level)',
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: 'normal',
  };

  const infoParaId = createId('txt_info_para');
  const infoPara: TextNode = {
    id: infoParaId,
    name: 'Callout Summary Paragraph',
    type: 'text',
    parent: infoBoxId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 24, y: 136, width: 950, height: 38, rotation: 0 },
    fills: solidFill(theme.textMuted),
    strokes: [],
    effects: [],
    content: 'Knowing your network details helps diagnose connectivity problems before calling the help desk. VPN users can confirm their traffic is routing through campus before accessing IP-restricted resources.',
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: 'normal',
  };

  infoBox.children!.push(infoHdrId, col1HdrId, col1BodyId, col2HdrId, col2BodyId, infoParaId);
  nodes.push(infoBox, infoHdr, col1Hdr, col1Body, col2Hdr, col2Body, infoPara);

  // 8. FULL FOOTER
  const footerId = createId('frm_footer');
  const footerFrame: FrameNode = {
    id: footerId,
    name: 'Portal Footer',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 1262, width: rootWidth, height: 178, rotation: 0 },
    fills: solidFill(footerBg),
    strokes: [],
    effects: [],
    cornerRadius: 0,
    clipContent: true,
    children: [],
  };

  // Footer Col 1
  const fCol1TitleId = createId('txt_fc1_title');
  const fCol1Title: TextNode = {
    id: fCol1TitleId,
    name: 'Col 1 Title',
    type: 'text',
    parent: footerId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 100, y: 24, width: 240, height: 20, rotation: 0 },
    fills: solidFill('#ffffff'),
    strokes: [],
    effects: [],
    content: 'Explore',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: 'bold',
  };
  const fCol1BodyId = createId('txt_fc1_body');
  const fCol1Body: TextNode = {
    id: fCol1BodyId,
    name: 'Col 1 Links',
    type: 'text',
    parent: footerId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 100, y: 48, width: 240, height: 58, rotation: 0 },
    fills: solidFill('#94a3b8'),
    strokes: [],
    effects: [],
    content: 'Frequently Asked Questions\nAbout "What is my IP?"\nSite Statistics',
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: 'normal',
  };

  // Footer Col 2
  const fCol2TitleId = createId('txt_fc2_title');
  const fCol2Title: TextNode = {
    id: fCol2TitleId,
    name: 'Col 2 Title',
    type: 'text',
    parent: footerId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 440, y: 24, width: 240, height: 20, rotation: 0 },
    fills: solidFill('#ffffff'),
    strokes: [],
    effects: [],
    content: 'More Resources',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: 'bold',
  };
  const fCol2BodyId = createId('txt_fc2_body');
  const fCol2Body: TextNode = {
    id: fCol2BodyId,
    name: 'Col 2 Links',
    type: 'text',
    parent: footerId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 440, y: 48, width: 240, height: 58, rotation: 0 },
    fills: solidFill('#94a3b8'),
    strokes: [],
    effects: [],
    content: 'Information Technology Services\nITS System Status\nITS Service Desk',
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: 'normal',
  };

  // Footer Col 3
  const fCol3TitleId = createId('txt_fc3_title');
  const fCol3Title: TextNode = {
    id: fCol3TitleId,
    name: 'Col 3 Title',
    type: 'text',
    parent: footerId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 780, y: 24, width: 320, height: 20, rotation: 0 },
    fills: solidFill('#ffffff'),
    strokes: [],
    effects: [],
    content: 'Connect with tech at UNC',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: 'bold',
  };
  const fCol3BodyId = createId('txt_fc3_body');
  const fCol3Body: TextNode = {
    id: fCol3BodyId,
    name: 'Col 3 Socials',
    type: 'text',
    parent: footerId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 780, y: 48, width: 320, height: 58, rotation: 0 },
    fills: solidFill('#94a3b8'),
    strokes: [],
    effects: [],
    content: '📷   👾   𝕏   ▶\n✉  ITS News Tech Connect newsletter',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 'normal',
  };

  // Footer Copyright
  const fCopyId = createId('txt_f_copy');
  const fCopy: TextNode = {
    id: fCopyId,
    name: 'Copyright Line',
    type: 'text',
    parent: footerId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 100, y: 138, width: 1000, height: 20, rotation: 0 },
    fills: solidFill('#64748b'),
    strokes: [],
    effects: [],
    content: 'Copyright © 2026 - Information Technology Services • v1.12.0',
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  };

  footerFrame.children!.push(fCol1TitleId, fCol1BodyId, fCol2TitleId, fCol2BodyId, fCol3TitleId, fCol3BodyId, fCopyId);
  nodes.push(footerFrame, fCol1Title, fCol1Body, fCol2Title, fCol2Body, fCol3Title, fCol3Body, fCopy);

  // Link children to Root Frame
  rootFrame.children!.push(
    headerId,
    navId,
    noticeId,
    printBtnId,
    ipBannerId,
    mapCardId,
    connCardId,
    moreBtnId,
    tableCardId,
    devCardId,
    vpnCardId,
    infoBoxId,
    footerId
  );
  nodes.push(rootFrame);

  return {
    title: 'What Is My IP - Network Diagnostics',
    nodes,
    rootFrameId: rootId,
    width: rootWidth,
    height: rootHeight,
  };
}

// Master Dispatcher: Analyzes prompt and returns appropriate generated design
export async function generateDesignFromPrompt(
  prompt: string,
  themeKey: DesignTheme = 'dark',
  originX: number = 100,
  originY: number = 100
): Promise<GeneratedDesignResult> {
  const theme = themeKey !== 'auto' && THEMES[themeKey] ? THEMES[themeKey] : THEMES.dark;
  const p = prompt.toLowerCase();

  let result: GeneratedDesignResult;

  // Intelligent Pattern Matching for diverse design requirements
  if (
    p.includes('ip') ||
    p.includes('network') ||
    p.includes('diagnostic') ||
    p.includes('connectivity') ||
    p.includes('vpn') ||
    p.includes('isp') ||
    p.includes('dns') ||
    p.includes('speed test') ||
    p.includes('portal') ||
    p.includes('what is my ip') ||
    p.includes('same screen') ||
    p.includes('attache')
  ) {
    result = generateNetworkDiagnosticsPortal(originX, originY, theme, prompt);
  } else if (
    p.includes('mobile') ||
    p.includes('phone') ||
    p.includes('ios') ||
    p.includes('android') ||
    p.includes('app screen')
  ) {
    result = generateMobileAppScreen(originX, originY, theme, prompt);
  } else if (
    p.includes('product') ||
    p.includes('ecommerce') ||
    p.includes('e-commerce') ||
    p.includes('shoe') ||
    p.includes('shop') ||
    p.includes('store') ||
    p.includes('cart') ||
    p.includes('sneaker') ||
    p.includes('buy') ||
    p.includes('bag') ||
    p.includes('item')
  ) {
    result = generateProductCard(originX, originY, theme, prompt);
  } else if (
    p.includes('music') ||
    p.includes('player') ||
    p.includes('audio') ||
    p.includes('song') ||
    p.includes('podcast') ||
    p.includes('track') ||
    p.includes('sound') ||
    p.includes('spotify')
  ) {
    result = generateMusicPlayer(originX, originY, theme, prompt);
  } else if (
    p.includes('profile') ||
    p.includes('user') ||
    p.includes('avatar') ||
    p.includes('author') ||
    p.includes('bio') ||
    p.includes('creator') ||
    p.includes('member') ||
    p.includes('team')
  ) {
    result = generateProfileCard(originX, originY, theme, prompt);
  } else if (
    p.includes('form') ||
    p.includes('contact') ||
    p.includes('support') ||
    p.includes('feedback') ||
    p.includes('input') ||
    p.includes('inquiry') ||
    p.includes('message')
  ) {
    result = generateContactForm(originX, originY, theme, prompt);
  } else if (
    p.includes('login') ||
    p.includes('auth') ||
    p.includes('sign in') ||
    p.includes('signin') ||
    p.includes('signup') ||
    p.includes('register') ||
    p.includes('modal')
  ) {
    result = generateLoginModal(originX, originY, theme);
  } else if (
    p.includes('analytics') ||
    p.includes('dashboard') ||
    p.includes('kpi') ||
    p.includes('metrics') ||
    p.includes('stats') ||
    p.includes('chart')
  ) {
    result = generateAnalyticsDashboard(originX, originY, theme);
  } else if (
    p.includes('pricing') ||
    p.includes('price table') ||
    p.includes('subscription') ||
    p.includes('tier') ||
    p.includes('plan') ||
    p.includes('price')
  ) {
    result = generatePricingCards(originX, originY, theme);
  } else if (
    p.includes('nav') ||
    p.includes('header') ||
    p.includes('menu') ||
    p.includes('navbar') ||
    p.includes('navigation')
  ) {
    result = generateNavbar(originX, originY, theme);
  } else if (
    p.includes('hero') ||
    p.includes('landing') ||
    p.includes('website') ||
    p.includes('web') ||
    p.includes('banner')
  ) {
    result = generateLandingHero(originX, originY, theme);
  } else {
    // Universal Smart Generator customized to whatever arbitrary prompt user inputs
    result = generateUniversalCard(originX, originY, theme, prompt);
  }

  // Resolve all relative child coordinates to absolute stage positions
  resolveAbsolutePositions(result.nodes, result.rootFrameId);

  return result;
}

// -------------------------------------------------------------
// IMAGE-TO-DESIGN AI VECTOR ENGINE
// -------------------------------------------------------------

export interface ImageAnalysisResult {
  theme: ThemeColors;
  aspectRatio: number;
  width: number;
  height: number;
  isDark: boolean;
  dominantColors: string[];
  suggestedType: 'mobile' | 'hero' | 'card';
}

// Analyzes uploaded image pixels to extract dominant palette and structural traits
export async function extractPaletteFromImage(imageSrc: string): Promise<ImageAnalysisResult> {
  return new Promise((resolve) => {
    const fallback: ImageAnalysisResult = {
      theme: THEMES.dark,
      aspectRatio: 1.6,
      width: 1200,
      height: 750,
      isDark: true,
      dominantColors: ['#0d99ff', '#6366f1', '#18181b', '#ffffff'],
      suggestedType: 'hero',
    };

    if (typeof window === 'undefined') {
      return resolve(fallback);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = window.document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(fallback);

        const sampleW = 64;
        const sampleH = 64;
        canvas.width = sampleW;
        canvas.height = sampleH;
        ctx.drawImage(img, 0, 0, sampleW, sampleH);

        const imgData = ctx.getImageData(0, 0, sampleW, sampleH).data;
        let totalBrightness = 0;
        let sampledCount = 0;
        const colorBuckets: { r: number; g: number; b: number; sat: number; count: number }[] = [];

        for (let i = 0; i < imgData.length; i += 16) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];
          if (a < 128) continue;

          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          totalBrightness += brightness;
          sampledCount++;

          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const sat = max === 0 ? 0 : (max - min) / max;

          let found = false;
          for (const bucket of colorBuckets) {
            const dist = Math.abs(bucket.r - r) + Math.abs(bucket.g - g) + Math.abs(bucket.b - b);
            if (dist < 48) {
              bucket.count++;
              found = true;
              break;
            }
          }
          if (!found && colorBuckets.length < 24) {
            colorBuckets.push({ r, g, b, sat, count: 1 });
          }
        }

        const avgBrightness = sampledCount > 0 ? totalBrightness / sampledCount : 100;
        const isDark = avgBrightness < 128;

        // Sort by saturation & prominence
        colorBuckets.sort((a, b) => b.sat * 2.5 + b.count * 0.05 - (a.sat * 2.5 + a.count * 0.05));

        const rgbToHex = (r: number, g: number, b: number) =>
          `#${[r, g, b].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('')}`;

        const accent1 = colorBuckets[0] ? rgbToHex(colorBuckets[0].r, colorBuckets[0].g, colorBuckets[0].b) : (isDark ? '#0d99ff' : '#2563eb');
        const accent2 = colorBuckets[1] ? rgbToHex(colorBuckets[1].r, colorBuckets[1].g, colorBuckets[1].b) : (isDark ? '#6366f1' : '#7c3aed');

        const dominantColors = colorBuckets.slice(0, 5).map((b) => rgbToHex(b.r, b.g, b.b));
        if (dominantColors.length < 2) dominantColors.push(accent1, accent2);

        const aspectRatio = img.width / Math.max(1, img.height);
        let suggestedType: 'mobile' | 'hero' | 'card' = 'hero';
        if (aspectRatio < 0.85) {
          suggestedType = 'mobile';
        } else if (aspectRatio >= 0.85 && aspectRatio <= 1.35) {
          suggestedType = 'card';
        } else {
          suggestedType = 'hero';
        }

        const customTheme: ThemeColors = {
          bg: isDark ? '#0a0b12' : '#f8fafc',
          cardBg: isDark ? '#141622' : '#ffffff',
          cardBgElevated: isDark ? '#1d2133' : '#f1f5f9',
          border: isDark ? '#262c42' : '#e2e8f0',
          textPrimary: isDark ? '#f8fafc' : '#0f172a',
          textSecondary: isDark ? '#94a3b8' : '#475569',
          textMuted: isDark ? '#64748b' : '#94a3b8',
          accent: accent1,
          accentSecondary: accent2,
          accentGradient: [accent1, accent2],
          success: '#10b981',
        };

        resolve({
          theme: customTheme,
          aspectRatio,
          width: img.width,
          height: img.height,
          isDark,
          dominantColors,
          suggestedType,
        });
      } catch (err) {
        resolve(fallback);
      }
    };

    img.onerror = () => resolve(fallback);
    img.src = imageSrc;
  });
}

// 1. Reconstruct Mobile App Screen from Image
export function generateImageMobileDesign(
  originX: number,
  originY: number,
  theme: ThemeColors,
  imageSrc: string,
  promptText?: string
): GeneratedDesignResult {
  const rootId = createId('frm_mob');
  const nodes: SceneNode[] = [];
  const rootWidth = 390;
  const rootHeight = 844;

  const rootFrame: FrameNode = {
    id: rootId,
    name: 'Mobile App - Reconstructed Screen',
    type: 'frame',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: originX, y: originY, width: rootWidth, height: rootHeight, rotation: 0 },
    fills: solidFill(theme.bg),
    strokes: solidStroke(theme.border, 2),
    effects: dropShadow(24, 0.2, 10),
    cornerRadius: 44,
    clipContent: true,
    children: [],
  };

  // Status Bar
  const timeId = createId('txt_time');
  const timeNode: TextNode = {
    id: timeId,
    name: 'Status Time',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 32, y: 16, width: 60, height: 18, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: '9:41',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: 'bold',
  };

  // App Header
  const headerId = createId('txt_header');
  const headerNode: TextNode = {
    id: headerId,
    name: 'Screen Header',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 24, y: 56, width: 280, height: 32, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: promptText?.trim() || 'Visual Showcase',
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: 'bold',
  };

  // Image Frame / Showcase Card
  const imgFrameId = createId('frm_img_showcase');
  const imgFrame: FrameNode = {
    id: imgFrameId,
    name: 'Featured Media Asset',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 20, y: 104, width: 350, height: 260, rotation: 0 },
    fills: solidFill(theme.cardBgElevated),
    strokes: solidStroke(theme.border),
    effects: dropShadow(16, 0.25, 6),
    cornerRadius: 24,
    clipContent: true,
    children: [],
  };

  const imgNodeId = createId('img_node');
  const imgNode: ImageNode = {
    id: imgNodeId,
    name: 'Uploaded Visual',
    type: 'image',
    parent: imgFrameId,
    src: imageSrc,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 0, width: 350, height: 260, rotation: 0 },
    fills: imageFill(imageSrc),
    strokes: [],
    effects: [],
    cornerRadius: 24,
  };
  imgFrame.children!.push(imgNodeId);

  // Badge over image
  const badgeId = createId('frm_pill');
  const badgeFrame: FrameNode = {
    id: badgeId,
    name: 'AI Analyzed Badge',
    type: 'frame',
    parent: imgFrameId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 16, y: 16, width: 140, height: 28, rotation: 0 },
    fills: solidFill(theme.accent, 0.9),
    strokes: [],
    effects: dropShadow(6, 0.2, 2),
    cornerRadius: 14,
    clipContent: true,
    children: [],
  };
  const badgeTextId = createId('txt_badge');
  const badgeText: TextNode = {
    id: badgeTextId,
    name: 'Badge Label',
    type: 'text',
    parent: badgeId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 6, width: 140, height: 16, rotation: 0 },
    fills: solidFill('#ffffff'),
    strokes: [],
    effects: [],
    content: '✨ AI Reconstructed',
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  };
  badgeFrame.children!.push(badgeTextId);
  imgFrame.children!.push(badgeId);

  // Detail Card
  const cardId = createId('frm_detail_card');
  const cardFrame: FrameNode = {
    id: cardId,
    name: 'Details Card',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 20, y: 384, width: 350, height: 290, rotation: 0 },
    fills: solidFill(theme.cardBg),
    strokes: solidStroke(theme.border),
    effects: dropShadow(12, 0.1, 4),
    cornerRadius: 20,
    clipContent: true,
    children: [],
  };

  const cardTitleId = createId('txt_card_title');
  const cardTitle: TextNode = {
    id: cardTitleId,
    name: 'Card Title',
    type: 'text',
    parent: cardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 20, y: 20, width: 310, height: 24, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: 'Intelligent Vector Composition',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: 'bold',
  };

  const cardSubId = createId('txt_card_sub');
  const cardSub: TextNode = {
    id: cardSubId,
    name: 'Card Description',
    type: 'text',
    parent: cardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 20, y: 48, width: 310, height: 36, rotation: 0 },
    fills: solidFill(theme.textSecondary),
    strokes: [],
    effects: [],
    content: 'Synthesized from visual inputs with pixel-perfect editable Figma vector layers.',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 'normal',
  };

  // 3 Feature Rows inside card
  const feats = [
    'Dynamic Palette Synchronized',
    'Full Auto-Layout Geometry',
    'Production Ready Vector Export',
  ];
  const featNodeIds: string[] = [];

  feats.forEach((feat, i) => {
    const fId = createId(`txt_feat_${i}`);
    const fNode: TextNode = {
      id: fId,
      name: `Feature ${i + 1}`,
      type: 'text',
      parent: cardId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 20, y: 104 + i * 36, width: 310, height: 20, rotation: 0 },
      fills: solidFill(theme.textPrimary),
      strokes: [],
      effects: [],
      content: `✓  ${feat}`,
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: '500',
    };
    featNodeIds.push(fId);
    nodes.push(fNode);
  });

  // CTA Button inside card
  const btnId = createId('frm_cta');
  const btnFrame: FrameNode = {
    id: btnId,
    name: 'Action Button',
    type: 'frame',
    parent: cardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 20, y: 224, width: 310, height: 46, rotation: 0 },
    fills: solidFill(theme.accent),
    strokes: [],
    effects: dropShadow(10, 0.25, 4),
    cornerRadius: 14,
    clipContent: true,
    children: [],
  };
  const btnTextId = createId('txt_btn_lbl');
  const btnText: TextNode = {
    id: btnTextId,
    name: 'Button Label',
    type: 'text',
    parent: btnId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 14, width: 310, height: 20, rotation: 0 },
    fills: solidFill('#ffffff'),
    strokes: [],
    effects: [],
    content: 'Explore Reconstructed UI  →',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  };
  btnFrame.children!.push(btnTextId);
  cardFrame.children!.push(cardTitleId, cardSubId, ...featNodeIds, btnId);

  // Bottom Tab Bar
  const navBarId = createId('frm_nav_bottom');
  const navBar: FrameNode = {
    id: navBarId,
    name: 'Bottom Tab Bar',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 20, y: 760, width: 350, height: 56, rotation: 0 },
    fills: solidFill(theme.cardBgElevated),
    strokes: solidStroke(theme.border),
    effects: dropShadow(12, 0.15, 4),
    cornerRadius: 28,
    clipContent: true,
    children: [],
  };
  const navTabs = ['Home', 'Explore', 'Saved', 'Profile'];
  const tabIds: string[] = [];
  navTabs.forEach((tab, ti) => {
    const tabId = createId(`txt_tab_${ti}`);
    const tabNode: TextNode = {
      id: tabId,
      name: `Tab ${tab}`,
      type: 'text',
      parent: navBarId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: ti * 87.5, y: 18, width: 87.5, height: 20, rotation: 0 },
      fills: solidFill(ti === 0 ? theme.accent : theme.textMuted),
      strokes: [],
      effects: [],
      content: tab,
      fontFamily: 'Inter',
      fontSize: 11,
      fontWeight: ti === 0 ? 'bold' : 'normal',
      textAlign: 'center',
    };
    tabIds.push(tabId);
    nodes.push(tabNode);
  });
  navBar.children!.push(...tabIds);

  rootFrame.children!.push(timeId, headerId, imgFrameId, cardId, navBarId);
  nodes.push(rootFrame, timeNode, headerNode, imgFrame, imgNode, badgeFrame, badgeText, cardFrame, cardTitle, cardSub, btnFrame, btnText, navBar);

  return { title: 'Mobile App Screen', nodes, rootFrameId: rootId, width: rootWidth, height: rootHeight };
}

// 2. Reconstruct SaaS Landing Hero from Image
export function generateImageHeroDesign(
  originX: number,
  originY: number,
  theme: ThemeColors,
  imageSrc: string,
  promptText?: string
): GeneratedDesignResult {
  const rootId = createId('frm_hero');
  const nodes: SceneNode[] = [];
  const rootWidth = 1240;
  const rootHeight = 740;

  const rootFrame: FrameNode = {
    id: rootId,
    name: 'SaaS Hero - Reconstructed from Image',
    type: 'frame',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: originX, y: originY, width: rootWidth, height: rootHeight, rotation: 0 },
    fills: solidFill(theme.bg),
    strokes: solidStroke(theme.border),
    effects: dropShadow(28, 0.18, 12),
    cornerRadius: 24,
    clipContent: true,
    children: [],
  };

  // Top Nav Bar
  const navId = createId('frm_nav');
  const navFrame: FrameNode = {
    id: navId,
    name: 'Navigation Bar',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 48, y: 28, width: rootWidth - 96, height: 60, rotation: 0 },
    fills: solidFill(theme.cardBg),
    strokes: solidStroke(theme.border),
    effects: dropShadow(8, 0.1, 2),
    cornerRadius: 16,
    clipContent: true,
    children: [],
  };

  const logoId = createId('txt_logo');
  const logoNode: TextNode = {
    id: logoId,
    name: 'Brand Logo',
    type: 'text',
    parent: navId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 24, y: 19, width: 140, height: 22, rotation: 0 },
    fills: solidFill(theme.accent),
    strokes: [],
    effects: [],
    content: '◆ Studio AI',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: 'bold',
  };

  const navLinks = ['Features', 'Design System', 'Architecture', 'Integrations'];
  const navLinkIds: string[] = [];
  navLinks.forEach((lnk, li) => {
    const lId = createId(`txt_lnk_${li}`);
    const lNode: TextNode = {
      id: lId,
      name: `Link ${lnk}`,
      type: 'text',
      parent: navId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 220 + li * 130, y: 21, width: 110, height: 18, rotation: 0 },
      fills: solidFill(theme.textSecondary),
      strokes: [],
      effects: [],
      content: lnk,
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '500',
    };
    navLinkIds.push(lId);
    nodes.push(lNode);
  });

  const navBtnId = createId('btn_nav_cta');
  const navBtn: FrameNode = {
    id: navBtnId,
    name: 'Nav CTA',
    type: 'frame',
    parent: navId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: rootWidth - 96 - 150, y: 12, width: 126, height: 36, rotation: 0 },
    fills: solidFill(theme.accent),
    strokes: [],
    effects: [],
    cornerRadius: 10,
    clipContent: true,
    children: [],
  };
  const navBtnTxtId = createId('txt_nav_btn');
  const navBtnTxt: TextNode = {
    id: navBtnTxtId,
    name: 'Label',
    type: 'text',
    parent: navBtnId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 9, width: 126, height: 18, rotation: 0 },
    fills: solidFill('#ffffff'),
    strokes: [],
    effects: [],
    content: 'Get Started',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  };
  navBtn.children!.push(navBtnTxtId);
  navFrame.children!.push(logoId, ...navLinkIds, navBtnId);
  nodes.push(navFrame, logoNode, navBtn, navBtnTxt);

  // Left Hero Content
  const badgeId = createId('frm_hero_badge');
  const badgeFrame: FrameNode = {
    id: badgeId,
    name: 'Release Badge',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 48, y: 130, width: 260, height: 32, rotation: 0 },
    fills: solidFill(theme.cardBgElevated),
    strokes: solidStroke(theme.accent, 1),
    effects: [],
    cornerRadius: 16,
    clipContent: true,
    children: [],
  };
  const badgeTxtId = createId('txt_badge_hero');
  const badgeTxt: TextNode = {
    id: badgeTxtId,
    name: 'Badge Text',
    type: 'text',
    parent: badgeId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 7, width: 260, height: 18, rotation: 0 },
    fills: solidFill(theme.accent),
    strokes: [],
    effects: [],
    content: '✨ Visual AI Synthesis Engine 2.0 →',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  };
  badgeFrame.children!.push(badgeTxtId);
  nodes.push(badgeFrame, badgeTxt);

  // Headline
  const h1Id = createId('txt_hero_h1');
  const h1Node: TextNode = {
    id: h1Id,
    name: 'Hero Headline',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 48, y: 184, width: 520, height: 130, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: promptText?.trim() || 'Bring Every Visual Concept to Life as Native Vectors',
    fontFamily: 'Inter',
    fontSize: 38,
    fontWeight: 'bold',
    lineHeight: 46,
  };

  // Subtitle
  const subId = createId('txt_hero_sub');
  const subNode: TextNode = {
    id: subId,
    name: 'Hero Subtitle',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 48, y: 334, width: 500, height: 60, rotation: 0 },
    fills: solidFill(theme.textSecondary),
    strokes: [],
    effects: [],
    content: 'Reconstruct high-fidelity user interfaces, mockups, and components instantly from reference images with zero configuration.',
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: 'normal',
    lineHeight: 24,
  };

  // CTA Button 1: Primary
  const cta1Id = createId('frm_cta_primary');
  const cta1: FrameNode = {
    id: cta1Id,
    name: 'Primary Action Button',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 48, y: 424, width: 190, height: 48, rotation: 0 },
    fills: solidFill(theme.accent),
    strokes: [],
    effects: dropShadow(14, 0.3, 4),
    cornerRadius: 12,
    clipContent: true,
    children: [],
  };
  const cta1TxtId = createId('txt_cta1');
  const cta1Txt: TextNode = {
    id: cta1TxtId,
    name: 'Label',
    type: 'text',
    parent: cta1Id,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 14, width: 190, height: 20, rotation: 0 },
    fills: solidFill('#ffffff'),
    strokes: [],
    effects: [],
    content: 'Start Creating Free  →',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  };
  cta1.children!.push(cta1TxtId);

  // CTA Button 2: Secondary Ghost
  const cta2Id = createId('frm_cta_sec');
  const cta2: FrameNode = {
    id: cta2Id,
    name: 'Secondary Button',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 254, y: 424, width: 160, height: 48, rotation: 0 },
    fills: solidFill(theme.cardBgElevated),
    strokes: solidStroke(theme.border),
    effects: [],
    cornerRadius: 12,
    clipContent: true,
    children: [],
  };
  const cta2TxtId = createId('txt_cta2');
  const cta2Txt: TextNode = {
    id: cta2TxtId,
    name: 'Label',
    type: 'text',
    parent: cta2Id,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 14, width: 160, height: 20, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: '▶  Watch Demo',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  };
  cta2.children!.push(cta2TxtId);

  // User rating social proof
  const ratingId = createId('txt_rating');
  const ratingNode: TextNode = {
    id: ratingId,
    name: 'Social Proof',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 48, y: 504, width: 380, height: 24, rotation: 0 },
    fills: solidFill(theme.textMuted),
    strokes: [],
    effects: [],
    content: '★★★★★  Rated 4.9/5 by 30,000+ Designers Worldwide',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
  };

  // Right Showcase Frame with Embedded Image
  const showcaseFrameId = createId('frm_showcase');
  const showcaseFrame: FrameNode = {
    id: showcaseFrameId,
    name: 'Visual Mockup Showcase',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 620, y: 130, width: 572, height: 470, rotation: 0 },
    fills: solidFill(theme.cardBg),
    strokes: solidStroke(theme.accent, 1.5),
    effects: dropShadow(28, 0.25, 12),
    cornerRadius: 20,
    clipContent: true,
    children: [],
  };

  // Browser Window Top Bar
  const browserBarId = createId('frm_browser_bar');
  const browserBar: FrameNode = {
    id: browserBarId,
    name: 'Window Bar',
    type: 'frame',
    parent: showcaseFrameId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 0, width: 572, height: 38, rotation: 0 },
    fills: solidFill(theme.cardBgElevated),
    strokes: solidStroke(theme.border),
    effects: [],
    cornerRadius: 0,
    clipContent: true,
    children: [],
  };
  const dots = ['#ff5f56', '#ffbd2e', '#27c93f'];
  const dotIds: string[] = [];
  dots.forEach((dotColor, di) => {
    const dotId = createId(`dot_${di}`);
    const dotNode: ShapeNode = {
      id: dotId,
      name: `Dot ${di + 1}`,
      type: 'ellipse',
      parent: browserBarId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 18 + di * 18, y: 13, width: 10, height: 10, rotation: 0 },
      fills: solidFill(dotColor),
      strokes: [],
      effects: [],
    };
    dotIds.push(dotId);
    nodes.push(dotNode);
  });
  browserBar.children!.push(...dotIds);

  // Embedded Image
  const imgNodeId = createId('img_showcase');
  const imgNode: ImageNode = {
    id: imgNodeId,
    name: 'Reconstructed Image Mockup',
    type: 'image',
    parent: showcaseFrameId,
    src: imageSrc,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 38, width: 572, height: 432, rotation: 0 },
    fills: imageFill(imageSrc),
    strokes: [],
    effects: [],
    cornerRadius: 0,
  };

  showcaseFrame.children!.push(browserBarId, imgNodeId);
  nodes.push(h1Node, subNode, cta1, cta1Txt, cta2, cta2Txt, ratingNode, showcaseFrame, browserBar, imgNode);
  rootFrame.children!.push(navId, badgeId, h1Id, subId, cta1Id, cta2Id, ratingId, showcaseFrameId);
  nodes.push(rootFrame);

  return { title: 'SaaS Landing Hero', nodes, rootFrameId: rootId, width: rootWidth, height: rootHeight };
}

// 3. Reconstruct Visual Dashboard from Image
export function generateImageCardDashboard(
  originX: number,
  originY: number,
  theme: ThemeColors,
  imageSrc: string,
  promptText?: string
): GeneratedDesignResult {
  const rootId = createId('frm_dash');
  const nodes: SceneNode[] = [];
  const rootWidth = 1080;
  const rootHeight = 680;

  const rootFrame: FrameNode = {
    id: rootId,
    name: 'Visual Analytics Dashboard',
    type: 'frame',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: originX, y: originY, width: rootWidth, height: rootHeight, rotation: 0 },
    fills: solidFill(theme.bg),
    strokes: solidStroke(theme.border),
    effects: dropShadow(20, 0.15, 8),
    cornerRadius: 24,
    clipContent: true,
    children: [],
  };

  // Header
  const titleId = createId('txt_dash_title');
  const titleNode: TextNode = {
    id: titleId,
    name: 'Dashboard Header',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 40, y: 36, width: 480, height: 32, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: promptText?.trim() || 'Visual Assets & Performance Overview',
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: 'bold',
  };

  const subId = createId('txt_dash_sub');
  const subNode: TextNode = {
    id: subId,
    name: 'Dashboard Subtitle',
    type: 'text',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 40, y: 72, width: 480, height: 20, rotation: 0 },
    fills: solidFill(theme.textSecondary),
    strokes: [],
    effects: [],
    content: 'Extracted vector layers, color metrics, and conversion telemetry.',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: 'normal',
  };

  // Left Showcase Card
  const leftCardId = createId('frm_left_card');
  const leftCard: FrameNode = {
    id: leftCardId,
    name: 'Primary Visual Asset',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 40, y: 114, width: 490, height: 510, rotation: 0 },
    fills: solidFill(theme.cardBg),
    strokes: solidStroke(theme.border),
    effects: dropShadow(14, 0.12, 4),
    cornerRadius: 18,
    clipContent: true,
    children: [],
  };

  const imgId = createId('img_dash');
  const imgNode: ImageNode = {
    id: imgId,
    name: 'Showcase Preview',
    type: 'image',
    parent: leftCardId,
    src: imageSrc,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 18, y: 18, width: 454, height: 310, rotation: 0 },
    fills: imageFill(imageSrc),
    strokes: solidStroke(theme.border),
    effects: [],
    cornerRadius: 14,
  };

  const cardLblId = createId('txt_asset_title');
  const cardLbl: TextNode = {
    id: cardLblId,
    name: 'Asset Name',
    type: 'text',
    parent: leftCardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 20, y: 348, width: 450, height: 24, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: 'Analyzed Reference Composition',
    fontFamily: 'Inter',
    fontSize: 17,
    fontWeight: 'bold',
  };

  const cardDescId = createId('txt_asset_desc');
  const cardDesc: TextNode = {
    id: cardDescId,
    name: 'Asset Description',
    type: 'text',
    parent: leftCardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 20, y: 378, width: 450, height: 40, rotation: 0 },
    fills: solidFill(theme.textSecondary),
    strokes: [],
    effects: [],
    content: 'Full vector reconstruction with synchronized color palette, typography hierarchy, and scalable layout.',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 'normal',
  };

  const btnId = createId('btn_card_act');
  const btnFrame: FrameNode = {
    id: btnId,
    name: 'Card Action',
    type: 'frame',
    parent: leftCardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 20, y: 440, width: 450, height: 44, rotation: 0 },
    fills: solidFill(theme.accent),
    strokes: [],
    effects: dropShadow(8, 0.2, 2),
    cornerRadius: 12,
    clipContent: true,
    children: [],
  };
  const btnTxtId = createId('txt_btn_lbl');
  const btnTxt: TextNode = {
    id: btnTxtId,
    name: 'Button Label',
    type: 'text',
    parent: btnId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 13, width: 450, height: 20, rotation: 0 },
    fills: solidFill('#ffffff'),
    strokes: [],
    effects: [],
    content: 'Export Vector Component  →',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  };
  btnFrame.children!.push(btnTxtId);
  leftCard.children!.push(imgId, cardLblId, cardDescId, btnId);

  // Right Column Metrics
  const rightX = 554;
  const metrics = [
    { title: 'Visual Fidelity Score', value: '99.4%', change: '+12.5% Optimal' },
    { title: 'Vector Nodes Synthesized', value: '28 Elements', change: 'Editable SVG' },
  ];
  const metricCardIds: string[] = [];

  metrics.forEach((m, mi) => {
    const mCardId = createId(`frm_m_${mi}`);
    const mCard: FrameNode = {
      id: mCardId,
      name: `Metric ${m.title}`,
      type: 'frame',
      parent: rootId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: rightX, y: 114 + mi * 140, width: 486, height: 124, rotation: 0 },
      fills: solidFill(theme.cardBg),
      strokes: solidStroke(theme.border),
      effects: dropShadow(10, 0.1, 3),
      cornerRadius: 16,
      clipContent: true,
      children: [],
    };

    const mTitleId = createId(`txt_mt_${mi}`);
    const mTitle: TextNode = {
      id: mTitleId,
      name: 'Metric Title',
      type: 'text',
      parent: mCardId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 24, y: 20, width: 300, height: 18, rotation: 0 },
      fills: solidFill(theme.textSecondary),
      strokes: [],
      effects: [],
      content: m.title,
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: '500',
    };

    const mValId = createId(`txt_mv_${mi}`);
    const mVal: TextNode = {
      id: mValId,
      name: 'Metric Value',
      type: 'text',
      parent: mCardId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 24, y: 46, width: 260, height: 40, rotation: 0 },
      fills: solidFill(theme.textPrimary),
      strokes: [],
      effects: [],
      content: m.value,
      fontFamily: 'Inter',
      fontSize: 28,
      fontWeight: 'bold',
    };

    const mBadgeId = createId(`frm_mb_${mi}`);
    const mBadge: FrameNode = {
      id: mBadgeId,
      name: 'Trend Badge',
      type: 'frame',
      parent: mCardId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 340, y: 46, width: 122, height: 28, rotation: 0 },
      fills: solidFill(theme.accent, 0.15),
      strokes: solidStroke(theme.accent, 1),
      effects: [],
      cornerRadius: 14,
      clipContent: true,
      children: [],
    };
    const mBadgeTxtId = createId(`txt_mbt_${mi}`);
    const mBadgeTxt: TextNode = {
      id: mBadgeTxtId,
      name: 'Badge Text',
      type: 'text',
      parent: mBadgeId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 0, y: 6, width: 122, height: 16, rotation: 0 },
      fills: solidFill(theme.accent),
      strokes: [],
      effects: [],
      content: m.change,
      fontFamily: 'Inter',
      fontSize: 11,
      fontWeight: 'bold',
      textAlign: 'center',
    };
    mBadge.children!.push(mBadgeTxtId);
    mCard.children!.push(mTitleId, mValId, mBadgeId);
    metricCardIds.push(mCardId);
    nodes.push(mCard, mTitle, mVal, mBadge, mBadgeTxt);
  });

  // Recent Activity Card
  const actCardId = createId('frm_act_card');
  const actCard: FrameNode = {
    id: actCardId,
    name: 'Activity Timeline',
    type: 'frame',
    parent: rootId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: rightX, y: 408, width: 486, height: 216, rotation: 0 },
    fills: solidFill(theme.cardBgElevated),
    strokes: solidStroke(theme.border),
    effects: dropShadow(10, 0.1, 3),
    cornerRadius: 16,
    clipContent: true,
    children: [],
  };
  const actTitleId = createId('txt_act_title');
  const actTitle: TextNode = {
    id: actTitleId,
    name: 'Section Header',
    type: 'text',
    parent: actCardId,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 24, y: 20, width: 300, height: 20, rotation: 0 },
    fills: solidFill(theme.textPrimary),
    strokes: [],
    effects: [],
    content: 'Reconstruction Milestones',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: 'bold',
  };
  actCard.children!.push(actTitleId);

  const actItems = [
    'Layer hierarchy matched and auto-framed',
    'High contrast WCAG typography calibrated',
    'Responsive vector bounds aligned to canvas',
  ];
  const actItemIds: string[] = [];
  actItems.forEach((item, ii) => {
    const itmId = createId(`txt_item_${ii}`);
    const itmNode: TextNode = {
      id: itmId,
      name: `Step ${ii + 1}`,
      type: 'text',
      parent: actCardId,
      visible: true,
      locked: false,
      opacity: 1,
      transform: { x: 24, y: 56 + ii * 44, width: 440, height: 20, rotation: 0 },
      fills: solidFill(theme.textSecondary),
      strokes: [],
      effects: [],
      content: `●  ${item}`,
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: 'normal',
    };
    actItemIds.push(itmId);
    nodes.push(itmNode);
  });
  actCard.children!.push(...actItemIds);

  rootFrame.children!.push(titleId, subId, leftCardId, ...metricCardIds, actCardId);
  nodes.push(rootFrame, titleNode, subNode, leftCard, imgNode, cardLbl, cardDesc, btnFrame, btnTxt, actCard, actTitle);

  return { title: 'Visual Dashboard', nodes, rootFrameId: rootId, width: rootWidth, height: rootHeight };
}

// Master Dispatcher for Image to Design
export async function generateDesignFromImage(
  imageSrc: string,
  prompt: string = '',
  themeKey: DesignTheme = 'auto',
  originX: number = 100,
  originY: number = 100
): Promise<GeneratedDesignResult> {
  const analysis = await extractPaletteFromImage(imageSrc);

  // Determine theme to use
  let theme: ThemeColors;
  if (themeKey === 'auto') {
    theme = analysis.theme;
  } else {
    theme = THEMES[themeKey] || analysis.theme;
  }

  const p = prompt.toLowerCase();
  let result: GeneratedDesignResult;

  // Original code commented out per guidelines:
  // if (p.includes('mobile') || p.includes('app') || p.includes('phone') || p.includes('screen') || (!prompt && analysis.suggestedType === 'mobile')) {
  //   result = generateImageMobileDesign(originX, originY, theme, imageSrc, prompt);
  // } else if (p.includes('dashboard') || p.includes('analytics') || p.includes('metric') || p.includes('card') || (!prompt && analysis.suggestedType === 'card')) {
  //   result = generateImageCardDashboard(originX, originY, theme, imageSrc, prompt);
  // } else {
  //   // Default to high-converting Landing Hero
  //   result = generateImageHeroDesign(originX, originY, theme, imageSrc, prompt);
  // }

  if (
    p.includes('same') ||
    p.includes('attache') ||
    p.includes('attached') ||
    p.includes('recreate') ||
    p.includes('clone') ||
    p.includes('copy') ||
    p.includes('color change') ||
    p.includes('theme change') ||
    p.includes('change color') ||
    p.includes('ip') ||
    p.includes('network') ||
    p.includes('diagnostic') ||
    p.includes('portal') ||
    p.includes('vpn') ||
    p.includes('unc') ||
    p.includes('isp') ||
    p.includes('connectivity')
  ) {
    result = generateNetworkDiagnosticsPortal(originX, originY, theme, prompt, imageSrc);
  } else if (p.includes('mobile') || p.includes('app') || p.includes('phone') || p.includes('screen') || (!prompt && analysis.suggestedType === 'mobile')) {
    result = generateImageMobileDesign(originX, originY, theme, imageSrc, prompt);
  } else if (p.includes('dashboard') || p.includes('analytics') || p.includes('metric') || p.includes('card') || (!prompt && analysis.suggestedType === 'card')) {
    result = generateImageCardDashboard(originX, originY, theme, imageSrc, prompt);
  } else {
    // Default to high-converting Landing Hero
    result = generateImageHeroDesign(originX, originY, theme, imageSrc, prompt);
  }

  resolveAbsolutePositions(result.nodes, result.rootFrameId);
  return result;
}
