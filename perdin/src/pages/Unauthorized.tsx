import { ArrowLeft, LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";
import { Brand } from "../components/Brand";

export default function Unauthorized() {
  return (
    <main className="df-denied">
      <Brand />
      <section>
        <LockKeyhole size={25} aria-hidden="true" />
        <h1>Akses dibatasi</h1>
        <p>Peran akun Anda tidak memiliki izin untuk membuka halaman ini.</p>
        <Link to="/"><ArrowLeft size={16} aria-hidden="true" /> Kembali ke ruang kerja</Link>
      </section>
    </main>
  );
}
