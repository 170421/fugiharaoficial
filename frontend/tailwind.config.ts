import type { Config } from 'tailwindcss';

// Design System FARMA-X v2.0
// Paleta `brand` = paleta azul única do ECOSSISTEMA FUGIHARA (marca-mãe + todas
// as submarcas), conforme decisão do CEO de unificação (set/2026) sobre
// fugi-norma-ecossistema §8.2/§8.6. Não inventar tons: apenas os 7 hex
// homologados. Ver frontend/DESIGN_SYSTEM.md.
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#E6F1FB',
          200: '#B5D4F4',
          300: '#85B7EB',
          400: '#378ADD',
          500: '#185FA5',
          700: '#0C447C',
          900: '#042C53',
        },
        // Ouro de prestígio da marca-mãe. EXCLUSIVO do selo de endosso
        // "parte do ECOSSISTEMA FUGIHARA" — nunca em botões, links, ícones
        // ou qualquer chrome do FARMA-X. Ver regra 90/8/2 no DESIGN_SYSTEM.md.
        endorsement: {
          gold: '#FCA311',
          bronze: '#A15C05', // usar sobre fundo claro; ouro puro só sobre fundo escuro
        },
        // Reservado para indicadores que representam literalmente o canal
        // WhatsApp (ex.: chip "mensagens enviadas via WhatsApp"). Nunca usar
        // em chrome, navegação, botões ou qualquer acento de marca — ver
        // regra de uso no DESIGN_SYSTEM.md.
        channel: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#25D366',
          600: '#128C7E',
          700: '#075E54',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'Arial', 'Helvetica', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
