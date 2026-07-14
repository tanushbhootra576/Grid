const fs = require('fs');

let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// Rename Home to DesktopHome
code = code.replace('export default function Home() {', 'function DesktopHome() {');

// Add import
if (!code.includes('react-responsive')) {
  code = "import { useMediaQuery } from 'react-responsive';\n" + code;
}

// Append MobileHome and new Home
const mobileHomeCode = `
function MobileHome() {
  return (
    <div style={{ padding: '100px 20px', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <h1 style={{ fontFamily: 'var(--font-space)', fontSize: '3rem', lineHeight: 1.1, marginBottom: 20 }}>
        Build skills.<br/>Ship projects.<br/>Own your campus.
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 40, fontSize: '1.1rem' }}>
        The peer-driven platform where university students build skills and ship projects.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 400 }}>
        <Link href="/discussions" style={{ padding: '16px', background: 'var(--bg-2)', border: '1px solid var(--border)', textDecoration: 'none', color: 'var(--text)', fontWeight: 600 }}>
          Discussion Forums
        </Link>
        <Link href="/projects" style={{ padding: '16px', background: 'var(--bg-2)', border: '1px solid var(--border)', textDecoration: 'none', color: 'var(--text)', fontWeight: 600 }}>
          Project Teams
        </Link>
        <Link href="/skills" style={{ padding: '16px', background: 'var(--bg-2)', border: '1px solid var(--border)', textDecoration: 'none', color: 'var(--text)', fontWeight: 600 }}>
          Skill Marketplace
        </Link>
        <Link href="/pow" style={{ padding: '16px', background: 'var(--bg-2)', border: '1px solid var(--border)', textDecoration: 'none', color: 'var(--text)', fontWeight: 600 }}>
          Cryptographic PoW
        </Link>
      </div>
    </div>
  );
}

export default function Home() {
  const [mounted, setMounted] = React.useState(false);
  const isMobile = useMediaQuery({ maxWidth: 768 });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <DesktopHome />;
  }

  return isMobile ? <MobileHome /> : <DesktopHome />;
}
`;

if (!code.includes('function MobileHome')) {
  code += mobileHomeCode;
}

fs.writeFileSync('src/app/page.tsx', code);
console.log("Successfully updated page.tsx");
