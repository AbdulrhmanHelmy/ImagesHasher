"use client";
import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';

interface IProductData {
  _id: string;
  name: string;
  price: number;
  imageUrl: string;
  distance?: number;
}

export default function SmartStorePage() {
  // --- States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProductData | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [products, setProducts] = useState<IProductData[]>([]);
  const [searchResults, setSearchResults] = useState<IProductData[]>([]);
  const [searchTerm, setSearchTerm] = useState(""); // State للبحث بالاسم
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  // --- Initial Load ---
  useEffect(() => {
    fetchProducts();
  }, []);

  // Close image with Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedImage(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // --- API Functions ---
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/search');
      const data = await res.json();
      if (data.products) setProducts(data.products);
    } catch (err) {
      console.error("Fetch error");
    }
  };

  const handleSearchByImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const loadingToast = toast.loading("جاري تحليل الصورة والبحث...");
    setLoading(true);
    const formData = new FormData();
    formData.append('file', e.target.files[0]);

    try {
      const res = await fetch('/api/search', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success && data.results.length > 0) {
        setSearchResults(data.results);
        toast.success(`وجدنا ${data.results.length} نتائج مطابقة`, { id: loadingToast });
      } else {
        toast.error("لم نجد نتائج مطابقة تماماً", { id: loadingToast });
      }
    } catch (err) {
      toast.error("فشل البحث بالصورة", { id: loadingToast });
    } finally {
      setLoading(false);
      e.target.value = ''; 
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadLoading(true);
    const formData = new FormData(e.currentTarget);
    if (editingProduct) formData.append('id', editingProduct._id);

    const endpoint = editingProduct ? '/api/edit-product' : '/api/add-product';
    try {
      const res = await fetch(endpoint, { 
        method: editingProduct ? 'PUT' : 'POST', 
        body: formData 
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingProduct ? "تم تحديث المنتج!" : "تمت الإضافة بنجاح!");
        fetchProducts();
        closeModal();
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء المعالجة");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    try {
      const res = await fetch(`/api/delete-product?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("تم الحذف بنجاح");
        fetchProducts();
      }
    } catch (err) {
      toast.error("فشل الحذف");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  // --- Logic: Combine Image Search + Text Filter ---
  const displayList = (searchResults.length > 0 ? searchResults : products).filter(item =>
    (item.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans overflow-hidden text-right" dir="rtl">
      <Toaster position="bottom-left" />

      {/* 1. Navbar الاحترافي */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg">S</div>
          <h1 className="text-xl font-bold text-slate-800 hidden lg:block">المعرض الذكي</h1>
        </div>

        <div className="flex flex-1 items-center gap-3 w-full max-w-2xl">
          {/* حقل البحث بالاسم */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 right-3 flex items-center pr-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input
              type="text"
              placeholder="ابحث بالاسم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-500 text-slate-800"
            />
          </div>

          {/* زر البحث بالصورة أو العودة */}
          {searchResults.length > 0 ? (
            <button 
              onClick={() => { setSearchResults([]); setSearchTerm(""); toast("تمت العودة للكل"); }}
              className="p-2.5 bg-orange-500 text-white rounded-xl shadow-md hover:bg-orange-600 transition-all animate-in zoom-in"
              title="العودة للقائمة الكاملة"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
          ) : (
            <label className="p-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer transition-all" title="بحث بصورة">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <input type="file" accept="image/*" className="hidden" onChange={handleSearchByImage} />
            </label>
          )}

          {/* زر الإضافة */}
          <button onClick={() => setIsModalOpen(true)} className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all active:scale-95" title="إضافة منتج">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>
      </nav>

      {/* 2. منطقة عرض المنتجات (Responsive Grid) */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-[1600px] mx-auto">
          {displayList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
              {displayList.map((item) => (
                <div key={item._id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col">
                  {/* الصورة */}
                  <div className="relative aspect-square bg-slate-50 overflow-hidden cursor-zoom-in" onClick={() => setSelectedImage(item.imageUrl)}>
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-2 left-2 bg-indigo-600 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-md">
                      {item.price} ج.م
                    </div>
                  </div>
                  {/* المحتوى */}
                  <div className="p-4 flex flex-col gap-3">
                    <h3 className="font-bold text-slate-800 truncate">{item.name || "منتج بدون اسم"}</h3>
                    <div className="flex gap-2 pt-2 border-t border-slate-50">
                      <button onClick={() => {setEditingProduct(item); setIsModalOpen(true);}} className="flex-1 text-xs font-bold py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all">تعديل</button>
                      <button onClick={() => handleDelete(item._id)} className="px-3 py-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-4">
              <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <p className="text-lg">لم نجد أي نتائج تطابق بحثك</p>
            </div>
          )}
        </div>
      </main>

      {/* 3. مودال الإضافة والتعديل */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">{editingProduct ? "تعديل بيانات المنتج" : "إضافة منتج جديد"}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-2xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">صورة المنتج</label>
                <div className="relative group border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center bg-slate-50 hover:border-indigo-400 transition-all cursor-pointer">
                  <input name="file" type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" required={!editingProduct} />
                  <span className="text-slate-500 text-sm font-medium">اختر صورة أو اسحبها هنا</span>
                </div>
              </div>
              <input type="text" name="name" defaultValue={editingProduct?.name || ""} placeholder="اسم المنتج (اختياري)" className="w-full px-5 py-4 rounded-2xl border border-slate-300 placeholder:text-slate-500 text-slate-800 focus:border-indigo-600 outline-none transition-all bg-white" />
              <input type="number" name="price" defaultValue={editingProduct?.price || ""} placeholder="السعر (ج.م)" required className="w-full px-5 py-4 rounded-2xl border border-slate-300 placeholder:text-slate-500 text-slate-800 focus:border-indigo-600 outline-none transition-all bg-white" />
              <button disabled={uploadLoading} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50">
                {uploadLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. عرض الصورة بملء الشاشة */}
      {selectedImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-8 right-8 text-white text-5xl hover:text-slate-300 transition-colors">&times;</button>
          <img src={selectedImage} alt="Full View" className="max-w-full max-h-full rounded-lg shadow-2xl object-contain animate-in zoom-in duration-300" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}