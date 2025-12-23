import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieChartIcon, 
  Target, 
  AlertTriangle, 
  Wallet, 
  Settings,
  Briefcase,
  Home,
  Coffee,
  Car,
  Tv,
  Book,
  Heart,
  DollarSign,
  Calculator,
  RefreshCw,
  Trash2,
  Sparkles,
  Loader2,
  X,
  Cloud,
  Calendar,
  BarChart3,
  Map,
  LogOut,
  User,
  Lock,
  Mail,
  ArrowRight
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithCustomToken,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot } from "firebase/firestore";

// --- CONFIGURAÇÃO DO FIREBASE (Cole sua config aqui) ---

const firebaseConfig = {
  apiKey: "AIzaSyDzlr66ae7GomAL4Bre_0vhhcy3MKBer6w",
  authDomain: "zenfinance-64601.firebaseapp.com",
  projectId: "zenfinance-64601",
  storageBucket: "zenfinance-64601.firebasestorage.app",
  messagingSenderId: "861221954944",
  appId: "1:861221954944:web:15bfe267d19e4920f9cd65"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'zen-finance-v1'; // Identificador do app no Firestore

// Cole sua API Key do Gemini aqui
const apiKey = "AIzaSyAC1PDUhsiPeCrDcQjO3Q-zB3lmEIgNUbA"; 

// Categorias e Subcategorias sugeridas
const CATEGORIES = {
  Moradia: { icon: <Home className="w-4 h-4" />, color: 'bg-blue-500' },
  Alimentação: { icon: <Coffee className="w-4 h-4" />, color: 'bg-orange-500' },
  Transporte: { icon: <Car className="w-4 h-4" />, color: 'bg-purple-500' },
  Lazer: { icon: <Tv className="w-4 h-4" />, color: 'bg-pink-500' },
  Educação: { icon: <Book className="w-4 h-4" />, color: 'bg-indigo-500' },
  Saúde: { icon: <Heart className="w-4 h-4" />, color: 'bg-red-500' },
  Investimentos: { icon: <TrendingUp className="w-4 h-4" />, color: 'bg-emerald-500' },
  Dívidas: { icon: <AlertTriangle className="w-4 h-4" />, color: 'bg-slate-700' },
  Renda: { icon: <DollarSign className="w-4 h-4" />, color: 'bg-green-500' },
};

const AUTO_RULES = [
  { keywords: ['spotify', 'netflix', 'disney', 'prime'], category: 'Lazer' },
  { keywords: ['uber', '99', 'posto', 'gasolina'], category: 'Transporte' },
  { keywords: ['ifood', 'restaurante', 'mercado', 'pão'], category: 'Alimentação' },
  { keywords: ['aluguel', 'condominio', 'luz', 'água'], category: 'Moradia' },
  { keywords: ['salário', 'job', 'freela', 'pix recebido'], category: 'Renda' },
];

const App = () => {
  // --- ESTADOS GERAIS ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // --- ESTADOS DE AUTH ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // --- ESTADOS DE DADOS ---
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);

  // Estados UI/Simulação
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiType, setAiType] = useState('advice'); 
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Simulador de Decisões
  const [customScenarios, setCustomScenarios] = useState([]);
  const [newScenario, setNewScenario] = useState({ name: '', value: '' });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  
  const [newTx, setNewTx] = useState({ description: '', amount: '', category: 'Alimentação', date: new Date().toISOString().split('T')[0], recurring: false });
  const [newGoal, setNewGoal] = useState({ name: '', target: '', current: '0', deadline: '' });

  // --- AUTENTICAÇÃO INICIAL ---
  useEffect(() => {
    const initAuth = async () => {
      // Prioridade: Token customizado do ambiente (se existir)
      if (typeof window !== 'undefined' && window.__initial_auth_token) {
        try {
          await signInWithCustomToken(auth, window.__initial_auth_token);
        } catch (e) {
          console.error("Erro token custom:", e);
        }
      }
      // NOTA: Removemos o signInAnonymously automático para forçar o login manual
      setLoading(false);
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- LISTENERS DE DADOS (Só rodam se user existir) ---
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setGoals([]);
      return;
    }
    
    // Listener de Transações
    const unsubscribeTx = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'transactions'), (snap) => {
      const txs = snap.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() }));
      txs.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(txs);
    });

    // Listener de Metas
    const unsubscribeGoals = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'goals'), (snap) => {
      setGoals(snap.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() })));
    });

    return () => { unsubscribeTx(); unsubscribeGoals(); };
  }, [user]);

  // --- FUNÇÕES DE AUTH ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/invalid-credential') setAuthError('E-mail ou senha incorretos.');
      else if (error.code === 'auth/email-already-in-use') setAuthError('Este e-mail já está cadastrado.');
      else if (error.code === 'auth/weak-password') setAuthError('A senha deve ter pelo menos 6 caracteres.');
      else setAuthError('Ocorreu um erro. Tente novamente.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setTransactions([]);
    setGoals([]);
    // Limpar estados locais
    setCustomScenarios([]);
    setActiveTab('dashboard');
  };

  // --- CÁLCULOS & ANALYTICS ---
  const totals = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return { income, expenses, balance: income - expenses };
  }, [transactions]);

  const categoryData = useMemo(() => {
    const data = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      data[t.category] = (data[t.category] || 0) + t.amount;
    });
    return Object.entries(data).sort((a, b) => b[1] - a[1]);
  }, [transactions]);

  const monthlyComparison = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    
    const currentMonthExpenses = transactions
      .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === currentMonth)
      .reduce((acc, t) => acc + t.amount, 0);
      
    const lastMonthExpenses = transactions
      .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === lastMonth)
      .reduce((acc, t) => acc + t.amount, 0);

    if (lastMonthExpenses === 0) return null;
    const diff = ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
    return { diff, current: currentMonthExpenses, last: lastMonthExpenses };
  }, [transactions]);

  const heatmapData = useMemo(() => {
    const days = {};
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for(let i=1; i<=daysInMonth; i++) days[i] = 0;
    transactions
      .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === now.getMonth())
      .forEach(t => {
        const d = parseInt(t.date.split('-')[2]);
        if (days[d] !== undefined) days[d] += t.amount;
      });
    return days;
  }, [transactions]);

  const timelineData = useMemo(() => {
    const recurringIncome = transactions.filter(t => t.type === 'income' && t.recurring).reduce((acc, t) => acc + t.amount, 0);
    const recurringExpenses = transactions.filter(t => t.type === 'expense' && t.recurring).reduce((acc, t) => acc + t.amount, 0);
    const variableExpenses = transactions.filter(t => t.type === 'expense' && !t.recurring).reduce((acc, t) => acc + t.amount, 0);
    const avgVariable = variableExpenses / 1; // Simplificado

    const scenariosImpact = customScenarios.reduce((acc, scen) => acc + parseFloat(scen.value), 0);
    const projectedMonthlySurplus = recurringIncome - recurringExpenses - avgVariable + scenariosImpact;
    
    const points = [];
    let currentBalance = totals.balance;
    for (let i = 0; i <= 12; i++) {
      points.push({ month: i, value: currentBalance });
      currentBalance += projectedMonthlySurplus;
    }
    return points;
  }, [totals.balance, transactions, customScenarios]);

  // --- UTILS ---
  const calculateGoalSavings = (goal) => {
    if (!goal.deadline) return null;
    const deadline = new Date(goal.deadline);
    const now = new Date();
    const monthsLeft = (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth());
    if (monthsLeft <= 0) return 0;
    const needed = goal.target - goal.current;
    return needed > 0 ? needed / monthsLeft : 0;
  };

  const handleAddScenario = () => {
    if(!newScenario.name || !newScenario.value) return;
    setCustomScenarios([...customScenarios, { ...newScenario, id: Date.now() }]);
    setNewScenario({ name: '', value: '' });
  };
  
  const removeScenario = (id) => {
    setCustomScenarios(customScenarios.filter(s => s.id !== id));
  };

  const callGemini = async (prompt) => {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      );
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch {
      return "Erro na IA.";
    }
  };

  const generateReport = async () => {
    setIsAiLoading(true); setAiType('report'); setShowAiModal(true); setAiAnalysis('');
    const prompt = `Gere um Relatório Financeiro breve. Gastei R$ ${totals.expenses.toFixed(2)}. Maior categoria: ${categoryData[0]?.[0] || 'Nenhuma'}. Saldo: R$ ${totals.balance.toFixed(2)}. Dê feedback curto e motivador.`;
    const res = await callGemini(prompt);
    setAiAnalysis(res); setIsAiLoading(false);
  };

  const handleAddTransaction = async () => {
    if (!newTx.description || !newTx.amount || !user) return;
    let cat = newTx.category;
    AUTO_RULES.forEach(r => { if(r.keywords.some(k => newTx.description.toLowerCase().includes(k))) cat = r.category; });
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'transactions'), {
      ...newTx, amount: parseFloat(newTx.amount), type: cat === 'Renda' ? 'income' : 'expense', category: cat, createdAt: Date.now()
    });
    setShowAddModal(false); setNewTx({ description: '', amount: '', category: 'Alimentação', date: new Date().toISOString().split('T')[0], recurring: false });
  };

  const handleAddGoal = async () => {
    if (!newGoal.name || !newGoal.target || !user) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'goals'), {
      name: newGoal.name, target: parseFloat(newGoal.target), current: parseFloat(newGoal.current), deadline: newGoal.deadline
    });
    setShowGoalModal(false); setNewGoal({ name: '', target: '', current: '0', deadline: '' });
  };

  // --- TELA DE LOGIN / CADASTRO ---
  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-sm p-8 rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-100 p-4 rounded-full">
              <Cloud className="w-10 h-10 text-indigo-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-indigo-900 mb-2">ZenFinance</h1>
          <p className="text-center text-slate-500 mb-8 text-sm">Controle seu passado, planeje seu futuro.</p>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 ml-1 uppercase">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="email" 
                  required
                  placeholder="seu@email.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-indigo-500 transition-colors"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-500 ml-1 uppercase">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="password" 
                  required
                  placeholder="******"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-indigo-500 transition-colors"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            {authError && <p className="text-xs text-rose-500 text-center font-medium bg-rose-50 p-2 rounded-lg">{authError}</p>}

            <button 
              type="submit" 
              disabled={authLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {authLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : (isRegistering ? 'Criar Conta' : 'Entrar')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }}
              className="text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors"
            >
              {isRegistering ? 'Já tem uma conta? Entrar' : 'Não tem conta? Cadastre-se'}
            </button>
          </div>
          
          <div className="mt-8 border-t pt-6 text-center">
            <p className="text-[10px] text-slate-400">Ao continuar, você aceita salvar seus dados na nuvem segura.</p>
          </div>
        </div>
      </div>
    );
  }

  // --- APP PRINCIPAL (Carregando ou Logado) ---
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-indigo-600"/></div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-32">
      {/* HEADER */}
      <header className="bg-white border-b sticky top-0 z-10 p-4 pt-safe-top flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
          <Cloud className="w-6 h-6" /> ZenFinance
        </h1>
        <div className="flex gap-2">
          <button onClick={handleLogout} className="p-2 bg-slate-100 rounded-full hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition-colors" title="Sair">
            <LogOut className="w-4 h-4"/>
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        
        {/* === DASHBOARD === */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Saldo Main */}
            <section className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
              <div className="relative z-10">
                <span className="text-indigo-200 text-sm font-medium">Patrimônio Total</span>
                <h2 className="text-4xl font-bold mt-2 tracking-tight">R$ {totals.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                <div className="flex gap-2 mt-6">
                   <div className="bg-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-300"/> 
                      <span className="text-sm font-semibold">R$ {totals.income}</span>
                   </div>
                   <div className="bg-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-rose-300"/> 
                      <span className="text-sm font-semibold">R$ {totals.expenses}</span>
                   </div>
                </div>
              </div>
              <Sparkles className="absolute -top-4 -right-4 w-32 h-32 text-white/5" />
            </section>

            {/* Metas Inteligentes */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2"><Target className="w-5 h-5 text-indigo-500"/> Metas de Vida</h3>
                <button onClick={() => setShowGoalModal(true)} className="text-indigo-600 text-xs font-bold bg-indigo-50 px-3 py-1 rounded-full">+ Nova</button>
              </div>
              <div className="space-y-3">
                {goals.map(goal => {
                  const monthlyNeed = calculateGoalSavings(goal);
                  return (
                    <div key={goal.firestoreId} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-slate-800">{goal.name}</p>
                          {goal.deadline && (
                            <p className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3"/> Até {new Date(goal.deadline).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded-lg">
                          {Math.round((goal.current/goal.target)*100)}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                        <div className="h-full bg-indigo-500" style={{width: `${(goal.current/goal.target)*100}%`}}></div>
                      </div>
                      {monthlyNeed !== null && (
                        <p className="text-xs text-indigo-600 font-medium bg-indigo-50 p-2 rounded-lg inline-block">
                          💡 Guarde <b>R$ {monthlyNeed.toFixed(0)}/mês</b> para atingir
                        </p>
                      )}
                    </div>
                  );
                })}
                {goals.length === 0 && <p className="text-center text-slate-400 text-sm">Adicione uma meta para começar a planejar.</p>}
              </div>
            </section>

            {/* Atalho para Transações */}
            <button onClick={() => setShowAddModal(true)} className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
              <Plus className="w-5 h-5"/> Registrar Gasto Rápido
            </button>
          </div>
        )}

        {/* === INSIGHTS === */}
        {activeTab === 'insights' && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
             <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Consciência Financeira</h2>
                <button onClick={generateReport} className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-200"><Sparkles className="w-5 h-5"/></button>
             </div>

             {/* Comparativo */}
             {monthlyComparison && (
               <div className={`p-5 rounded-2xl text-white shadow-lg flex items-center gap-4 ${monthlyComparison.diff > 0 ? 'bg-rose-500 shadow-rose-200' : 'bg-emerald-500 shadow-emerald-200'}`}>
                 <div className="bg-white/20 p-3 rounded-full">
                   {monthlyComparison.diff > 0 ? <TrendingUp className="w-6 h-6"/> : <TrendingDown className="w-6 h-6"/>}
                 </div>
                 <div>
                   <p className="text-white/80 text-xs font-medium uppercase tracking-wider">Mês Atual vs. Anterior</p>
                   <p className="text-lg font-bold leading-tight">
                     Você gastou {Math.abs(monthlyComparison.diff).toFixed(1)}% {monthlyComparison.diff > 0 ? 'a MAIS' : 'a MENOS'}
                   </p>
                 </div>
               </div>
             )}

             {/* Heatmap */}
             <div className="bg-white p-5 rounded-3xl border shadow-sm">
               <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Map className="w-4 h-4"/> Mapa de Gastos (Dias)</h3>
               <div className="grid grid-cols-7 gap-2">
                 {Object.entries(heatmapData).map(([day, val]) => {
                   // Escala de cor baseada no valor (max assumido 500 para demo)
                   const intensity = Math.min(val / 200, 1); 
                   return (
                     <div key={day} className="flex flex-col items-center gap-1">
                       <div 
                         className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all"
                         style={{
                           backgroundColor: val === 0 ? '#f1f5f9' : `rgba(244, 63, 94, ${0.2 + intensity * 0.8})`,
                           color: val === 0 ? '#94a3b8' : val > 300 ? 'white' : '#881337'
                         }}
                       >
                         {day}
                       </div>
                     </div>
                   )
                 })}
               </div>
               <p className="text-[10px] text-slate-400 mt-3 text-center">Dias mais vermelhos indicam gastos elevados.</p>
             </div>

             {/* Relatório IA Botão Grande */}
             <div className="bg-gradient-to-r from-violet-100 to-indigo-100 p-6 rounded-3xl text-center">
                <Sparkles className="w-8 h-8 text-indigo-600 mx-auto mb-2"/>
                <h3 className="font-bold text-indigo-900">Relatório Mensal Inteligente</h3>
                <p className="text-xs text-indigo-700 mb-4 px-4">Receba uma análise completa do que melhorou e onde focar.</p>
                <button onClick={generateReport} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-transform">
                  Gerar Relatório Agora
                </button>
             </div>
          </div>
        )}

        {/* === PLANEJAMENTO (FUTURO) === */}
        {activeTab === 'future' && (
          <div className="space-y-6 animate-in zoom-in-95">
             {/* Gráfico Linha do Tempo SVG */}
             <section className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-2xl overflow-hidden relative">
               <div className="flex justify-between items-end mb-6">
                 <div>
                   <h2 className="text-2xl font-bold">Futuro</h2>
                   <p className="text-slate-400 text-xs">Simulação de 12 meses</p>
                 </div>
                 <BarChart3 className="w-8 h-8 text-indigo-400 opacity-50"/>
               </div>
               
               {/* SVG Chart Area */}
               <div className="h-40 w-full flex items-end gap-1 relative">
                 {/* Linha base */}
                 <div className="absolute bottom-0 w-full h-[1px] bg-slate-700"></div>
                 {timelineData.map((point, i) => {
                   const maxVal = Math.max(...timelineData.map(p => p.value)) * 1.2;
                   const height = Math.max((point.value / maxVal) * 100, 5); // min 5% height
                   return (
                     <div key={i} className="flex-1 flex flex-col justify-end group relative">
                       {/* Tooltip */}
                       <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                         Mês {point.month}: R$ {point.value.toFixed(0)}
                       </div>
                       {/* Bar */}
                       <div 
                         className={`w-full rounded-t-sm transition-all duration-500 ${i === 0 ? 'bg-emerald-500' : 'bg-indigo-500/60 hover:bg-indigo-400'}`}
                         style={{ height: `${height}%` }}
                       ></div>
                     </div>
                   )
                 })}
               </div>
               <div className="flex justify-between text-[10px] text-slate-500 mt-2">
                 <span>Hoje</span>
                 <span>6 Meses</span>
                 <span>1 Ano</span>
               </div>
             </section>

             {/* Simulador de Decisões */}
             <section className="bg-white p-5 rounded-3xl border shadow-sm">
               <h3 className="font-bold mb-4 flex items-center gap-2"><Calculator className="w-4 h-4 text-indigo-500"/> Simulador de Decisões</h3>
               
               <div className="space-y-3 mb-4">
                 {customScenarios.map(scen => (
                   <div key={scen.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                     <span className="text-sm font-medium">{scen.name}</span>
                     <div className="flex items-center gap-3">
                       <span className={`text-sm font-bold ${scen.value > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                         {scen.value > 0 ? '+' : ''}{scen.value}/mês
                       </span>
                       <button onClick={() => removeScenario(scen.id)}><X className="w-4 h-4 text-slate-300 hover:text-rose-500"/></button>
                     </div>
                   </div>
                 ))}
               </div>

               <div className="flex gap-2">
                 <input 
                   placeholder="Ex: Novo Emprego" 
                   className="flex-1 bg-slate-50 border-none rounded-xl px-3 py-2 text-sm"
                   value={newScenario.name}
                   onChange={e => setNewScenario({...newScenario, name: e.target.value})}
                 />
                 <input 
                   placeholder="+/- Valor" 
                   type="number"
                   className="w-24 bg-slate-50 border-none rounded-xl px-3 py-2 text-sm"
                   value={newScenario.value}
                   onChange={e => setNewScenario({...newScenario, value: e.target.value})}
                 />
                 <button onClick={handleAddScenario} className="bg-indigo-600 text-white p-2 rounded-xl"><Plus className="w-5 h-5"/></button>
               </div>
               <p className="text-[10px] text-slate-400 mt-2">Adicione eventos (ex: -500 para financiamento) para ver o impacto no gráfico acima.</p>
             </section>
          </div>
        )}
      </main>

      {/* NAV BAR */}
      <nav className="fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-xl border border-slate-200 p-2 rounded-3xl flex justify-around items-center shadow-2xl z-20 pb-safe-bottom">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all active:scale-95 ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
          <Home className="w-5 h-5" /><span className="text-[10px]">Início</span>
        </button>
        <button onClick={() => setActiveTab('insights')} className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all active:scale-95 ${activeTab === 'insights' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
          <PieChartIcon className="w-5 h-5" /><span className="text-[10px]">Insights</span>
        </button>
        <button onClick={() => setActiveTab('future')} className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all active:scale-95 ${activeTab === 'future' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
          <Map className="w-5 h-5" /><span className="text-[10px]">Futuro</span>
        </button>
      </nav>

      {/* MODALS */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-bold text-lg mb-4">Adicionar Transação</h3>
            <input autoFocus placeholder="Descrição (ex: Mercado)" className="w-full bg-slate-50 p-3 rounded-xl mb-3" value={newTx.description} onChange={e=>setNewTx({...newTx, description: e.target.value})}/>
            <div className="flex gap-3 mb-3">
              <input type="number" placeholder="Valor" className="flex-1 bg-slate-50 p-3 rounded-xl" value={newTx.amount} onChange={e=>setNewTx({...newTx, amount: e.target.value})}/>
              <input type="date" className="w-32 bg-slate-50 p-3 rounded-xl" value={newTx.date} onChange={e=>setNewTx({...newTx, date: e.target.value})}/>
            </div>
            <div onClick={()=>setNewTx({...newTx, recurring: !newTx.recurring})} className={`p-3 rounded-xl border mb-4 flex items-center gap-2 cursor-pointer ${newTx.recurring ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100'}`}>
               <RefreshCw className="w-4 h-4"/> <span>É recorrente? (Fixo todo mês)</span>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>setShowAddModal(false)} className="flex-1 p-3 text-slate-500">Cancelar</button>
              <button onClick={handleAddTransaction} className="flex-1 p-3 bg-indigo-600 text-white rounded-xl font-bold">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {showGoalModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-bold text-lg mb-4">Nova Meta de Vida</h3>
            <input autoFocus placeholder="Nome da Meta (ex: Carro Novo)" className="w-full bg-slate-50 p-3 rounded-xl mb-3" value={newGoal.name} onChange={e=>setNewGoal({...newGoal, name: e.target.value})}/>
            <div className="flex gap-3 mb-3">
              <input type="number" placeholder="Valor Alvo" className="flex-1 bg-slate-50 p-3 rounded-xl" value={newGoal.target} onChange={e=>setNewGoal({...newGoal, target: e.target.value})}/>
              <input type="number" placeholder="Já tenho..." className="flex-1 bg-slate-50 p-3 rounded-xl" value={newGoal.current} onChange={e=>setNewGoal({...newGoal, current: e.target.value})}/>
            </div>
            <label className="text-xs text-slate-500 ml-1">Data Limite (Opcional)</label>
            <input type="date" className="w-full bg-slate-50 p-3 rounded-xl mb-4" value={newGoal.deadline} onChange={e=>setNewGoal({...newGoal, deadline: e.target.value})}/>
            <div className="flex gap-2">
              <button onClick={()=>setShowGoalModal(false)} className="flex-1 p-3 text-slate-500">Cancelar</button>
              <button onClick={handleAddGoal} className="flex-1 p-3 bg-indigo-600 text-white rounded-xl font-bold">Criar Meta</button>
            </div>
          </div>
        </div>
      )}

      {showAiModal && (
        <div className="fixed inset-0 bg-indigo-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="bg-indigo-600 p-6 text-white shrink-0">
               <div className="flex justify-between items-start">
                 <div className="flex items-center gap-2 mb-1">
                   <Sparkles className="w-5 h-5 text-yellow-300"/> 
                   <h3 className="font-bold text-lg">{aiType === 'report' ? 'Relatório Mensal' : 'Conselho Zen'}</h3>
                 </div>
                 <button onClick={()=>setShowAiModal(false)}><X className="w-5 h-5 text-white/70 hover:text-white"/></button>
               </div>
               <p className="text-indigo-200 text-xs">Análise por Inteligência Artificial</p>
            </div>
            <div className="p-6 overflow-y-auto">
              {isAiLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4"/>
                  <p className="text-slate-500">Analisando seus dados...</p>
                </div>
              ) : (
                <div className="prose prose-sm prose-indigo text-slate-600 whitespace-pre-wrap leading-relaxed">{aiAnalysis}</div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;