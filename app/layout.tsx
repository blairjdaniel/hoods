import '../styles/globals.css';
import Providers from './providers';
import Header from '../components/Header';

export const metadata = {
  title: 'Hoods DAO',
  description: 'A minimal DApp for NFT trait swaps on Solana devnet',
};

export default function RootLayout({ children }: { children: React.ReactNode }){
  return (
    <html lang="en">
      <body className="app-root">
        <Providers>
          <Header />
          <main>
            <div className="app-container">{children}</div>
          </main>
        </Providers>
      </body>
    </html>
  );
}
