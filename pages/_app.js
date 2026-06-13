import { ThemeProvider } from '../lib/theme'
import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  )
}
