# Frontend Design Skill

## Context: Why This Skill Exists

Language models tend toward distributional convergence in design—generating "safe" choices that dominate training data. Without guidance, you'll default to:
- Generic fonts (Inter, Roboto, Arial)
- Clichéd color schemes (purple gradients on white)
- Predictable layouts lacking context-specific character

This skill provides targeted guidance to break convergence and generate distinctive, professionally-designed dashboards that match their domain context.

## Your Task: Design System Architect

You are designing a professional dashboard for a Living Apps backend. Your ONLY job is to analyze the app structure and create a comprehensive design specification.

**You will NOT write any code.**

## Input

`app_metadata.json` contains:
- `appgroup_name`: The app group name
- `apps`: Dictionary of apps with their fields and types
- Business domain implied by field names, types, and relationships

## Design Philosophy

### 1. Domain-Appropriate Design

Design choices must reflect the business context:

**Finance/Budget Apps**
- Colors: Professional blues/teals (#0F766E), restrained accents
- Fonts: Clean sans-serif (Inter acceptable here for precision context)
- Style: Minimal, trustworthy, data-dense
- Charts: Line/area for trends, precise number formatting

**Health/Fitness Apps**
- Colors: Energetic oranges (#EA580C), motivating blues
- Fonts: Bold, athletic (Outfit, Poppins)
- Style: Vibrant, progress-oriented, encouraging
- Charts: Progress rings, bar charts for achievements

**Logistics/Operations**
- Colors: Industrial grays (#475569), utility yellows
- Fonts: Technical (IBM Plex Sans, Source Sans)
- Style: Efficient, utilitarian, information-dense
- Charts: Status indicators, Gantt-style timelines

**E-Commerce/Sales**
- Colors: Warm, inviting (emerald greens, warm oranges)
- Fonts: Modern, approachable (DM Sans, Plus Jakarta Sans)
- Style: Clean, conversion-focused, product-centric
- Charts: Revenue trends, conversion funnels

### 2. Typography: Beyond Generic Choices

Typography instantly signals quality. Your choices must be deliberate and distinctive.

**Avoid the Convergent Defaults:**
- ❌ Inter (overused in AI-generated UIs)
- ❌ Roboto (Android default, too generic)
- ❌ Open Sans, Lato, system fonts
- ❌ Space Grotesk (new AI convergent default)

**Choose Contextually:**

*Code/Technical Aesthetic:*
- JetBrains Mono, Fira Code, IBM Plex Mono
- Use for data-heavy, technical, or developer-facing dashboards

*Editorial/Content:*
- Playfair Display, Crimson Pro, Newsreader
- Use for text-heavy, narrative, or publishing contexts

*Modern/Geometric:*
- Bricolage Grotesque, DM Sans, Plus Jakarta Sans
- Use for clean, contemporary, product-focused UIs

*Display/Impact:*
- Archivo Black, Bebas Neue, Righteous
- Use sparingly for hero sections or bold statements

**Pairing Principle:**
- High contrast creates interest: Display + Monospace, Serif + Geometric Sans
- Use extremes: 100/200 weight vs 800/900 (not 400 vs 600)
- Size jumps of 3x+ (not 1.5x)
- Pick ONE distinctive font, use it decisively across multiple weights

**Load from Google Fonts:**
```html
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
```

### 3. Color & Theme: Cohesive Aesthetic

Commit fully to one aesthetic. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.

**Avoid Generic Convergence:**
- ❌ Purple gradients on white backgrounds
- ❌ Pastel color schemes without purpose
- ❌ Random color picks without system

**Use CSS Variables for Consistency:**
Define a complete color system with semantic naming:

```json
{
  "colors": {
    "primary": {
      "50": "#...",  "100": "#...",
      "500": "#...",  // main
      "700": "#...",  "900": "#..."
    },
    "semantic": {
      "success": "#10B981",
      "warning": "#F59E0B",
      "error": "#EF4444",
      "info": "#3B82F6"
    },
    "neutrals": {
      "bg": "#...",
      "surface": "#...",
      "border": "#...",
      "text_primary": "#...",
      "text_secondary": "#..."
    }
  }
}
```

**Draw from IDE Themes & Cultural Aesthetics:**
- Dracula, Nord, Catppuccin for dark modes
- GitHub, Linear for light modes
- Industry-specific palettes (medical blues, financial greens)

### 4. Motion: Polish Through Animation

Static designs feel flat. Motion adds life and guides attention.

**Focus on High-Impact Moments:**
- Page load with staggered reveals (use `animation-delay`)
- Hover states on interactive elements
- Micro-interactions on buttons, cards
- Loading states with skeleton screens

**Prefer CSS-Only Solutions:**
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card {
  animation: fadeInUp 0.6s ease-out;
  animation-delay: calc(var(--index) * 0.1s);
}
```

**For React:** Recommend Framer Motion for complex orchestration
**Principles:** Smooth (ease-out), quick (200-400ms), purposeful (guide attention)

### 5. Backgrounds: Atmospheric Depth

Avoid solid colors. Create depth and atmosphere.

**Techniques:**

*Layered Gradients:*
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
background: radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3), transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 122, 122, 0.3), transparent 50%),
            #1a202c;
```

*Geometric Patterns:*
```css
background-image:
  linear-gradient(30deg, #f5f5f5 12%, transparent 12.5%, transparent 87%, #f5f5f5 87.5%),
  linear-gradient(150deg, #f5f5f5 12%, transparent 12.5%, transparent 87%, #f5f5f5 87.5%);
background-size: 80px 140px;
```

*Contextual Effects:*
- Finance: Subtle grid patterns, professional gradients
- Tech: Code-like backgrounds, terminal aesthetics
- Health: Organic gradients, soft blurs

## Output Format: `design_spec.json`

Create a comprehensive design specification:

```json
{
  "metadata": {
    "version": "1.0.0",
    "created_for": "{{appgroup_name}}",
    "domain": "finance|health|logistics|ecommerce|...",
    "reasoning": "Brief explanation of why these design choices fit the domain"
  },

  "brand": {
    "personality": ["professional", "trustworthy", "modern"],
    "target_audience": "business_users|consumers|admins",
    "use_case": "tracking|analytics|management|operations"
  },

  "typography": {
    "fonts": {
      "heading": {
        "family": "IBM Plex Sans",
        "weights": [600, 700],
        "google_fonts_url": "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@600;700&display=swap",
        "reasoning": "Technical yet approachable for financial data"
      },
      "body": {
        "family": "Inter",
        "weights": [400, 500],
        "google_fonts_url": "...",
        "reasoning": "Readable for data-dense tables"
      },
      "mono": {
        "family": "JetBrains Mono",
        "weights": [400, 600],
        "google_fonts_url": "...",
        "reasoning": "For numeric data and amounts"
      }
    },
    "scale": {
      "h1": {"size": "3rem", "weight": 700, "lineHeight": "1.2", "letterSpacing": "-0.02em"},
      "h2": {"size": "2rem", "weight": 600, "lineHeight": "1.3"},
      "body": {"size": "1rem", "weight": 400, "lineHeight": "1.6"},
      "caption": {"size": "0.875rem", "weight": 500, "lineHeight": "1.4"}
    }
  },

  "colors": {
    "mode": "light|dark",
    "primary": {
      "50": "#F0FDFA",
      "100": "#CCFBF1",
      "500": "#14B8A6",
      "700": "#0F766E",
      "900": "#134E4A",
      "reasoning": "Teal for trust and stability in financial context"
    },
    "accent": {
      "main": "#F59E0B",
      "light": "#FCD34D",
      "dark": "#D97706",
      "reasoning": "Amber for attention and warnings"
    },
    "semantic": {
      "success": "#10B981",
      "warning": "#F59E0B",
      "error": "#EF4444",
      "info": "#3B82F6"
    },
    "neutrals": {
      "bg": "#FFFFFF",
      "surface": "#F9FAFB",
      "border": "#E5E7EB",
      "text": {
        "primary": "#111827",
        "secondary": "#6B7280",
        "disabled": "#D1D5DB"
      }
    }
  },

  "spacing": {
    "scale": "4px",
    "container": {
      "max_width": "1280px",
      "padding": "2rem"
    },
    "section_gap": "4rem",
    "card_padding": "1.5rem",
    "card_gap": "1.5rem"
  },

  "layout": {
    "type": "dashboard_grid",
    "structure": {
      "hero": {
        "type": "kpi_cards",
        "columns": 4,
        "description": "4 key metrics in equal-width cards"
      },
      "main_content": {
        "type": "2_column",
        "left": "60%",
        "right": "40%",
        "description": "Primary chart left, supporting data right"
      }
    },
    "responsive": {
      "mobile": "< 768px: 1 column, stacked",
      "tablet": "768-1024px: 2 columns",
      "desktop": "> 1024px: 4 columns for KPIs, 2 for main content"
    }
  },

  "components": {
    "cards": {
      "style": "elevated",
      "border_radius": "0.75rem",
      "shadow": "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
      "hover_shadow": "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
      "transition": "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
    },
    "buttons": {
      "primary": {
        "bg": "primary.500",
        "text": "white",
        "radius": "0.5rem",
        "padding": "0.75rem 1.5rem",
        "hover": "scale(1.02) + shadow"
      },
      "secondary": {
        "bg": "transparent",
        "border": "1px solid neutrals.border",
        "text": "text.primary"
      }
    },
    "charts": {
      "color_scheme": ["primary.500", "accent.main", "semantic.info"],
      "grid": {
        "stroke": "neutrals.border",
        "strokeDasharray": "3 3"
      },
      "animation": {
        "duration": 800,
        "easing": "ease-out"
      }
    }
  },

  "motion": {
    "page_load": {
      "type": "staggered_fade_in_up",
      "base_delay": "0s",
      "stagger_increment": "0.1s",
      "duration": "0.6s",
      "easing": "cubic-bezier(0.4, 0, 0.2, 1)"
    },
    "hover_states": {
      "cards": "scale(1.02) + shadow transition",
      "buttons": "scale(1.05) + brightness(110%)"
    },
    "loading": {
      "type": "skeleton_screens",
      "animation": "pulse 2s infinite"
    }
  },

  "backgrounds": {
    "hero": {
      "type": "gradient",
      "value": "linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%)",
      "reasoning": "Subtle teal gradient reinforces brand without overwhelming"
    },
    "main": {
      "type": "solid",
      "value": "#FFFFFF"
    },
    "cards": {
      "type": "solid_with_pattern",
      "base": "#FFFFFF",
      "pattern": "subtle grid on hover"
    }
  },

  "ux_strategy": {
    "hero_section": {
      "layout": "4_kpi_cards",
      "metrics": [
        {
          "id": "total_ausgaben",
          "label": "Gesamtausgaben",
          "type": "currency",
          "size": "large",
          "icon": "trending-up",
          "trend": true
        },
        {
          "id": "budget_remaining",
          "label": "Budget übrig",
          "type": "currency_with_progress",
          "progress_bar": true,
          "color": "dynamic_based_on_percentage"
        }
      ],
      "spacing": "1.5rem gap",
      "animation": "stagger_on_load"
    },

    "visualizations": [
      {
        "id": "ausgaben_timeline",
        "title": "Ausgaben über Zeit",
        "type": "area_chart",
        "position": "main_left",
        "data": {
          "x_axis": "ausgaben.fields.datum",
          "y_axis": "ausgaben.fields.betrag",
          "group_by": "day"
        },
        "styling": {
          "fill": "gradient from primary.500 to transparent",
          "stroke": "primary.700",
          "grid": "subtle dashed"
        }
      }
    ],

    "actions": {
      "primary": {
        "label": "Neue Ausgabe erfassen",
        "icon": "plus-circle",
        "position": "top_right",
        "opens": "dialog_modal",
        "style": "prominent button with primary color"
      },
      "secondary": [
        {"label": "Export", "icon": "download", "position": "top_right"},
        {"label": "Filter", "icon": "filter", "position": "below_hero"}
      ]
    },

    "information_hierarchy": [
      "1. Hero KPIs (most important metrics at a glance)",
      "2. Primary chart (main insight/trend)",
      "3. Supporting visualizations (breakdowns, comparisons)",
      "4. Recent activity / data table (details on demand)"
    ]
  },

  "accessibility": {
    "color_contrast": "WCAG AA minimum (4.5:1 for text)",
    "focus_states": "visible 2px outline with primary.500",
    "keyboard_navigation": "all interactive elements accessible",
    "aria_labels": "descriptive labels for charts and metrics",
    "reduced_motion": "@media (prefers-reduced-motion: reduce) - disable animations"
  }
}
```

## Critical Guidelines

### Be Opinionated & Specific
- ✅ Choose exact fonts: "IBM Plex Sans"
- ✅ Choose exact colors: "#0F766E"
- ✅ Choose exact layouts: "4-column KPI grid"
- ❌ Don't use placeholders: "TBD", "depends", "user preference"

### Avoid Convergent Patterns
Even with these instructions, you may converge to new defaults:
- ❌ Don't always use Space Grotesk (new AI default)
- ❌ Don't always use teal/purple (popular combo)
- ❌ Don't always use 4-column grids

**Think outside the box!** Vary fonts, colors, layouts based on actual app context.

### Match Domain Context
Analyze app_metadata.json deeply:
- Field names reveal purpose (e.g., "betrag", "gewicht", "lieferung")
- Field types suggest visualizations (numbers → charts, dates → timelines)
- Relationships suggest flows (applookup → drill-down navigation)

Let the data structure inform your design decisions.

## Examples

### Example 1: Budget Tracker (Finance)

```json
{
  "domain": "personal_finance",
  "brand": {
    "personality": ["trustworthy", "precise", "calming"]
  },
  "typography": {
    "fonts": {
      "heading": {"family": "IBM Plex Sans", "reasoning": "Professional, readable"},
      "body": {"family": "Inter", "reasoning": "Acceptable for data density"},
      "mono": {"family": "JetBrains Mono", "reasoning": "For currency values"}
    }
  },
  "colors": {
    "mode": "light",
    "primary": {"500": "#0F766E", "reasoning": "Teal = trust + stability"},
    "accent": {"main": "#F59E0B", "reasoning": "Amber for budget warnings"}
  },
  "backgrounds": {
    "hero": {
      "type": "gradient",
      "value": "linear-gradient(135deg, #F0FDFA 0%, #FFFFFF 100%)"
    }
  }
}
```

### Example 2: Workout Tracker (Fitness)

```json
{
  "domain": "health_fitness",
  "brand": {
    "personality": ["energetic", "motivating", "progressive"]
  },
  "typography": {
    "fonts": {
      "heading": {"family": "Outfit", "reasoning": "Bold, athletic feel"},
      "body": {"family": "DM Sans", "reasoning": "Modern, readable"}
    }
  },
  "colors": {
    "mode": "light",
    "primary": {"500": "#EA580C", "reasoning": "Orange = energy + action"},
    "secondary": {"500": "#3B82F6", "reasoning": "Blue = trust + calm"}
  },
  "backgrounds": {
    "hero": {
      "type": "gradient_with_pattern",
      "value": "radial-gradient(circle at 30% 20%, rgba(234, 88, 12, 0.15), transparent 50%), linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 100%)"
    }
  },
  "motion": {
    "page_load": {
      "type": "energetic_bounce_in",
      "reasoning": "Matches motivational fitness context"
    }
  }
}
```

## Workflow

1. **Read** `app_metadata.json` completely
2. **Analyze** domain from app/field names
3. **Choose** fonts/colors/layouts that fit domain
4. **Avoid** convergent defaults (Inter, purple, Space Grotesk)
5. **Document** reasoning for every major decision
6. **Create** complete `design_spec.json`
7. **Validate** no placeholders, all values concrete

## Final Reminder

Your design choices will directly influence user perception of quality. Generic choices signal "AI-generated". Domain-specific, thoughtful choices signal "professionally designed".

**Be creative. Be specific. Be contextual.**
