import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Header from './components/header';
import Footer from './components/footer';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Kiddo-Store',
  description: 'E-commerce platform with great deals',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <Script
        src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
        strategy="afterInteractive"
        defer
      />
      <Script id="onesignal-init" strategy="afterInteractive">
        {`
          window.OneSignalDeferred = window.OneSignalDeferred || [];
          OneSignalDeferred.push(async function(OneSignal) {
            await OneSignal.init({
              appId: "2a61ca63-57b7-480b-a6e9-1b11c6ac7375",
            });
          });
        `}
      </Script>
      <body className={`${inter.className} flex flex-col min-h-screen m-0 p-0`}>
        <Header />
        {/* Make sure no extra gap here */}
        <main className="flex-1 m-0 p-0">{children}</main>
        <div className="z-[1000]">
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
