# AI Chatbot - Gemini-Powered Personal Assistant

A modern, full-stack AI chatbot built with Next.js and Google Gemini 2.0. Features multiple AI personalities, image analysis, conversation history, and markdown rendering.

## 🌟 Features

- **Multiple AI Personalities** - Switch between 7 different AI modes (Professional, Technical, Creative, Educational, Brief, Friendly)
- **Custom Instructions** - Define your own AI personality with custom prompts
- **Image Analysis** - Upload images and chat about them using Gemini Vision
- **Conversation History** - Automatically saves your conversations in localStorage
- **Markdown Support** - Rich text rendering for code blocks, lists, and formatting
- **Copy to Clipboard** - Quick copy button for any message
- **Dark Mode** - Automatic theme switching based on system preferences
- **Modern UI** - Beautiful gradient design with smooth animations

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS
- **AI**: Google Gemini 2.0 Flash
- **Markdown**: react-markdown with GitHub Flavored Markdown

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-chatbot.git
cd ai-chatbot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
GOOGLE_API_KEY=your_api_key_here
```

Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎯 Usage

- Select an AI personality from the top menu
- Type your message and click Send or press Enter
- Click the camera icon to upload an image for analysis
- Use "Custom" mode to create your own AI instructions
- Click "New Chat" to start a fresh conversation

## 📝 AI Personalities

- **Default** 🤖 - Balanced and helpful
- **Friendly** 😊 - Warm and conversational
- **Professional** 💼 - Formal and structured
- **Technical** ⚙️ - Detailed with code examples
- **Creative** 🎨 - Vivid and inspiring
- **Educational** 📚 - Step-by-step explanations
- **Brief** ⚡ - Concise and direct

## 🔒 Security

Your API key is stored locally in `.env.local` and never committed to version control.

## 🚢 Deployment

The easiest way to deploy is with [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import the project in Vercel
3. Add your `GOOGLE_API_KEY` in the environment variables section
4. Deploy!

## 📄 License

MIT
