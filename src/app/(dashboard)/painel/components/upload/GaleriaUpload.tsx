'use client';

import { useState } from 'react';
import { logSupabaseError } from '@/lib/supabase/logError';

interface GaleriaUploadProps {
  imagensIniciais: string[];
  limite: number;
  onUpdate: (urls: string[]) => void;
}

export default function GaleriaUpload({ imagensIniciais, limite, onUpdate }: GaleriaUploadProps) {
  const [imagens, setImagens] = useState<string[]>(imagensIniciais);
  const [uploading, setUploading] = useState(false);

  const uploadParaCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
    formData.append('folder', 'estabelecimentos/galeria');

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );
      const data = await res.json();
      if (data.secure_url) {
        return data.secure_url;
      } else {
        throw new Error('Falha no upload');
      }
    } catch (error) {
      logSupabaseError('Erro no upload Cloudinary:', error);
      alert('Erro ao enviar imagem. Tente novamente.');
      return null;
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (imagens.length >= limite) {
      alert(`Limite de ${limite} imagens atingido.`);
      return;
    }

    setUploading(true);
    const url = await uploadParaCloudinary(file);
    if (url) {
      const novasImagens = [...imagens, url];
      setImagens(novasImagens);
      onUpdate(novasImagens);
    }
    setUploading(false);
    e.target.value = ''; // permite reenviar o mesmo arquivo depois
  };

  const removerImagem = (index: number) => {
    const novasImagens = imagens.filter((_, i) => i !== index);
    setImagens(novasImagens);
    onUpdate(novasImagens);
  };

  const reordenar = (de: number, para: number) => {
    if (para < 0 || para >= imagens.length) return;
    const novaLista = [...imagens];
    const [removido] = novaLista.splice(de, 1);
    novaLista.splice(para, 0, removido);
    setImagens(novaLista);
    onUpdate(novaLista);
  };

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
        {imagens.map((img, idx) => (
          <div key={idx} className="relative group">
            <img src={img} alt={`Galeria ${idx+1}`} className="w-full h-32 object-cover rounded-lg" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 rounded-lg">
              {idx > 0 && (
                <button onClick={() => reordenar(idx, idx-1)} className="text-white text-xl p-1 rounded hover:bg-white/20">
                  ⬅️
                </button>
              )}
              {idx < imagens.length-1 && (
                <button onClick={() => reordenar(idx, idx+1)} className="text-white text-xl p-1 rounded hover:bg-white/20">
                  ➡️
                </button>
              )}
              <button onClick={() => removerImagem(idx)} className="text-red-500 text-xl p-1 rounded hover:bg-white/20">
                🗑️
              </button>
            </div>
          </div>
        ))}
        {imagens.length < limite && (
          <label className="border-2 border-dashed rounded-lg flex flex-col items-center justify-center h-32 cursor-pointer hover:bg-gray-50 transition">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
            <span className="text-3xl">➕</span>
            <span className="text-xs text-gray-500 mt-1">
              {uploading ? 'Enviando...' : 'Adicionar'}
            </span>
          </label>
        )}
      </div>
      <p className="text-xs text-gray-500">
        {imagens.length}/{limite} imagens
      </p>
    </div>
  );
}