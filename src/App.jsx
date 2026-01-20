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
  ArrowRight,
  Bell
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
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";

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
  const [budgets, setBudgets] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [cardPurchases, setCardPurchases] = useState([]);
  const [investments, setInvestments] = useState([]);

  // Estados UI/Simulação
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiType, setAiType] = useState('advice'); 
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Simulador de Decisões
  const [customScenarios, setCustomScenarios] = useState([]);
  const [newScenario, setNewScenario] = useState({ name: '', value: '' });

  // Modais
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDayDetails, setShowDayDetails] = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showCardPurchaseModal, setShowCardPurchaseModal] = useState(false);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  
  // Estados de formulários
  const [newTx, setNewTx] = useState({ description: '', amount: '', category: 'Alimentação', date: new Date().toISOString().split('T')[0], recurring: false, type: 'expense', tags: [], installments: 1 });
  const [editingTx, setEditingTx] = useState(null);
  const [newGoal, setNewGoal] = useState({ name: '', target: '', current: '0', deadline: '', monthlyContribution: '' });
  const [newBudget, setNewBudget] = useState({ category: 'Alimentação', limit: '' });
  const [newReminder, setNewReminder] = useState({ 
    name: '', 
    amount: '', 
    dueDay: '', 
    category: 'Moradia',
    dueMonth: new Date().getMonth(),
    dueYear: new Date().getFullYear(),
    recurring: false
  });
  const [newCard, setNewCard] = useState({ 
    name: '', 
    limit: '', 
    closingDay: '', 
    dueDay: '', 
    brand: '' 
  });
  const [newCardPurchase, setNewCardPurchase] = useState({ 
    description: '', 
    amount: '', 
    installments: 1, 
    cardId: '', 
    purchaseDate: new Date().toISOString().split('T')[0],
    category: 'Alimentação'
  });
  const [newInvestment, setNewInvestment] = useState({
    name: '',
    type: 'Renda Fixa',
    currentValue: '',
    initialValue: '',
    isExisting: true, // true = já possuo (não desconta), false = novo aporte (desconta)
    date: new Date().toISOString().split('T')[0],
    notes: '',
    annualRate: '', // Taxa anual em %
    rateType: 'fixa', // fixa, cdi, ipca, selic
    autoCalculate: true // Se deve calcular rendimento automaticamente
  });
  
  // Filtros e Busca
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [transactionsToShow, setTransactionsToShow] = useState(10);

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
      setBudgets([]);
      setReminders([]);
      setCreditCards([]);
      setCardPurchases([]);
      setInvestments([]);
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

    // Listener de Orçamentos
    const unsubscribeBudgets = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'budgets'), (snap) => {
      setBudgets(snap.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() })));
    });

    // Listener de Lembretes
    const unsubscribeReminders = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'reminders'), (snap) => {
      setReminders(snap.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() })));
    });

    // Listener de Cartões de Crédito
    const unsubscribeCards = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'creditCards'), (snap) => {
      setCreditCards(snap.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() })));
    });

    // Listener de Compras no Cartão
    const unsubscribeCardPurchases = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'cardPurchases'), (snap) => {
      setCardPurchases(snap.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() })));
    });

    // Listener de Investimentos
    const unsubscribeInvestments = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'investments'), (snap) => {
      setInvestments(snap.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() })));
    });

    return () => { 
      unsubscribeTx(); 
      unsubscribeGoals(); 
      unsubscribeBudgets(); 
      unsubscribeReminders();
      unsubscribeCards();
      unsubscribeCardPurchases();
      unsubscribeInvestments();
    };
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
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = searchTerm === '' || 
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = filterCategory === 'all' || tx.category === filterCategory;
      const matchesType = filterType === 'all' || tx.type === filterType;
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [transactions, searchTerm, filterCategory, filterType]);

  const groupedTransactions = useMemo(() => {
    const groups = {};
    filteredTransactions.forEach(tx => {
      const date = new Date(tx.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      
      if (!groups[monthKey]) {
        groups[monthKey] = { label: monthLabel, transactions: [], total: 0 };
      }
      groups[monthKey].transactions.push(tx);
      if (tx.type === 'expense') {
        groups[monthKey].total += tx.amount;
      }
    });
    
    // Ordenar meses do mais recente ao mais antigo
    // e ordenar transações dentro de cada mês por data (mais recente primeiro)
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, data]) => ({
        key,
        ...data,
        transactions: data.transactions.sort((a, b) => {
          // Ordenar por data decrescente (mais recente primeiro)
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          if (dateB.getTime() !== dateA.getTime()) {
            return dateB.getTime() - dateA.getTime();
          }
          // Se mesma data, ordenar por createdAt (mais recente primeiro)
          return (b.createdAt || 0) - (a.createdAt || 0);
        })
      }));
  }, [filteredTransactions]);

  const totals = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return { income, expenses, balance: income - expenses };
  }, [transactions]);

  // Taxas de referência (valores aproximados - podem ser atualizados)
  const REFERENCE_RATES = {
    cdi: 13.15, // Taxa CDI anual aproximada
    selic: 13.25, // Taxa Selic anual aproximada
    ipca: 4.5, // IPCA anual aproximado
    poupanca: 7.5 // Poupança anual aproximada
  };

  // Função para calcular o valor projetado de um investimento
  const calculateProjectedValue = (investment) => {
    if (!investment.annualRate || !investment.autoCalculate) {
      return investment.currentValue || investment.initialValue || 0;
    }

    const startDate = new Date(investment.date);
    const now = new Date();
    const daysDiff = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 0) return investment.initialValue || 0;

    let annualRate = parseFloat(investment.annualRate);
    
    // Ajustar taxa baseado no tipo
    if (investment.rateType === 'cdi') {
      annualRate = (annualRate / 100) * REFERENCE_RATES.cdi;
    } else if (investment.rateType === 'selic') {
      annualRate = (annualRate / 100) * REFERENCE_RATES.selic;
    } else if (investment.rateType === 'ipca') {
      annualRate = REFERENCE_RATES.ipca + annualRate;
    } else if (investment.rateType === 'poupanca') {
      annualRate = REFERENCE_RATES.poupanca;
    }

    // Calcular rendimento composto diário
    const dailyRate = Math.pow(1 + annualRate / 100, 1 / 365) - 1;
    const projectedValue = (investment.initialValue || 0) * Math.pow(1 + dailyRate, daysDiff);
    
    return projectedValue;
  };

  // Cálculo dos investimentos com projeção automática
  const investmentTotals = useMemo(() => {
    let totalInvested = 0;
    let totalProjected = 0;
    const totalInitial = investments.reduce((acc, inv) => acc + (inv.initialValue || 0), 0);
    
    investments.forEach(inv => {
      const currentValue = inv.currentValue || inv.initialValue || 0;
      const projectedValue = calculateProjectedValue(inv);
      
      // Usar o maior valor entre o registrado e o projetado
      totalInvested += currentValue;
      totalProjected += inv.autoCalculate ? projectedValue : currentValue;
    });
    
    const profit = totalProjected - totalInitial;
    const profitPercentage = totalInitial > 0 ? (profit / totalInitial) * 100 : 0;
    
    // Agrupar por tipo
    const byType = {};
    investments.forEach(inv => {
      if (!byType[inv.type]) byType[inv.type] = 0;
      const projectedValue = inv.autoCalculate ? calculateProjectedValue(inv) : (inv.currentValue || 0);
      byType[inv.type] += projectedValue;
    });
    
    return { 
      total: totalProjected, 
      registered: totalInvested,
      initial: totalInitial, 
      profit, 
      profitPercentage,
      byType: Object.entries(byType).sort((a, b) => b[1] - a[1])
    };
  }, [investments]);

  // Patrimônio total (saldo + investimentos)
  const totalPatrimony = useMemo(() => {
    return totals.balance + investmentTotals.total;
  }, [totals.balance, investmentTotals.total]);

  const categoryData = useMemo(() => {
    const data = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      data[t.category] = (data[t.category] || 0) + t.amount;
    });
    return Object.entries(data).sort((a, b) => b[1] - a[1]);
  }, [transactions]);

  const budgetStatus = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return budgets.map(budget => {
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category === budget.category)
        .filter(t => {
          const txDate = new Date(t.date);
          return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
        })
        .reduce((acc, t) => acc + t.amount, 0);
      
      const percentage = (spent / budget.limit) * 100;
      return { ...budget, spent, percentage };
    });
  }, [budgets, transactions]);

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
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    for(let i=1; i<=daysInMonth; i++) days[i] = 0;
    transactions
      .filter(t => {
        const txDate = new Date(t.date);
        return t.type === 'expense' && 
               txDate.getMonth() === currentMonth && 
               txDate.getFullYear() === currentYear;
      })
      .forEach(t => {
        const txDate = new Date(t.date);
        const d = txDate.getDate();
        if (days[d] !== undefined) days[d] += t.amount;
      });
    return days;
  }, [transactions]);

  const timelineData = useMemo(() => {
    // Calcula receitas e despesas mensais baseadas nas transações dos últimos 3 meses
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    
    const recentTransactions = transactions.filter(t => new Date(t.date) >= threeMonthsAgo);
    const monthsInData = Math.max(((now.getFullYear() - threeMonthsAgo.getFullYear()) * 12 + now.getMonth() - threeMonthsAgo.getMonth()), 1);
    
    const avgMonthlyIncome = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0) / monthsInData;
    
    const avgMonthlyExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0) / monthsInData;

    const scenariosImpact = customScenarios.reduce((acc, scen) => acc + parseFloat(scen.value || 0), 0);
    const projectedMonthlySurplus = avgMonthlyIncome - avgMonthlyExpenses + scenariosImpact;
    
    const points = [];
    let currentBalance = totals.balance || 0;
    for (let i = 0; i <= 12; i++) {
      points.push({ month: i, value: currentBalance });
      currentBalance += projectedMonthlySurplus;
    }
    return points;
  }, [totals.balance, transactions, customScenarios]);

  // --- PREVISIBILIDADE FINANCEIRA ---
  const predictability = useMemo(() => {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    
    // Filtrar transações dos últimos 3 meses
    const last3Months = transactions.filter(t => new Date(t.date) >= threeMonthsAgo);
    
    // Calcular médias
    const avgIncome = last3Months
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0) / 3;
    
    const avgExpenses = last3Months
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0) / 3;
    
    const avgBalance = avgIncome - avgExpenses;
    
    // Média por categoria
    const avgByCategory = {};
    Object.keys(CATEGORIES).forEach(cat => {
      if (cat !== 'Renda') {
        const total = last3Months
          .filter(t => t.type === 'expense' && t.category === cat)
          .reduce((acc, t) => acc + t.amount, 0);
        avgByCategory[cat] = total / 3;
      }
    });
    
    // Gastos do mês atual
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentMonthExpenses = transactions
      .filter(t => t.type === 'expense' && 
        new Date(t.date).getMonth() === currentMonth && 
        new Date(t.date).getFullYear() === currentYear)
      .reduce((acc, t) => acc + t.amount, 0);
    
    const currentMonthIncome = transactions
      .filter(t => t.type === 'income' && 
        new Date(t.date).getMonth() === currentMonth && 
        new Date(t.date).getFullYear() === currentYear)
      .reduce((acc, t) => acc + t.amount, 0);
    
    // Gastos do mês anterior
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthExpenses = transactions
      .filter(t => t.type === 'expense' && 
        new Date(t.date).getMonth() === lastMonth && 
        new Date(t.date).getFullYear() === lastMonthYear)
      .reduce((acc, t) => acc + t.amount, 0);
    
    // Comparação por categoria (mês atual vs anterior)
    const categoryComparison = {};
    Object.keys(CATEGORIES).forEach(cat => {
      if (cat !== 'Renda') {
        const current = transactions
          .filter(t => t.type === 'expense' && t.category === cat &&
            new Date(t.date).getMonth() === currentMonth &&
            new Date(t.date).getFullYear() === currentYear)
          .reduce((acc, t) => acc + t.amount, 0);
        
        const last = transactions
          .filter(t => t.type === 'expense' && t.category === cat &&
            new Date(t.date).getMonth() === lastMonth &&
            new Date(t.date).getFullYear() === lastMonthYear)
          .reduce((acc, t) => acc + t.amount, 0);
        
        const avg = avgByCategory[cat] || 0;
        const diff = last > 0 ? ((current - last) / last) * 100 : 0;
        
        categoryComparison[cat] = {
          current,
          last,
          avg,
          diff,
          aboveAverage: current > avg * 1.15
        };
      }
    });
    
    // --- PROJEÇÃO COM RENDA VARIÁVEL ---
    // Cenários de renda (conservador, realista, otimista)
    const incomeScenarios = {
      conservative: avgIncome * 0.9,  // 10% abaixo da média
      realistic: avgIncome,            // Média exata
      optimistic: avgIncome * 1.1      // 10% acima da média
    };
    
    // Função para calcular projeção de saldo futuro
    const calculateProjection = (income, months) => {
      return totals.balance + ((income - avgExpenses) * months);
    };
    
    // Projeções futuras com cenários de renda variável
    const projections = {
      conservative: {
        in3Months: calculateProjection(incomeScenarios.conservative, 3),
        in6Months: calculateProjection(incomeScenarios.conservative, 6),
        in12Months: calculateProjection(incomeScenarios.conservative, 12)
      },
      realistic: {
        in3Months: calculateProjection(incomeScenarios.realistic, 3),
        in6Months: calculateProjection(incomeScenarios.realistic, 6),
        in12Months: calculateProjection(incomeScenarios.realistic, 12)
      },
      optimistic: {
        in3Months: calculateProjection(incomeScenarios.optimistic, 3),
        in6Months: calculateProjection(incomeScenarios.optimistic, 6),
        in12Months: calculateProjection(incomeScenarios.optimistic, 12)
      },
      // Manter compatibilidade com código antigo
      nextMonth: totals.balance + (avgIncome - avgExpenses),
      in3Months: calculateProjection(incomeScenarios.realistic, 3),
      in6Months: calculateProjection(incomeScenarios.realistic, 6),
      in12Months: calculateProjection(incomeScenarios.realistic, 12)
    };
    
    // Alertas inteligentes
    const alerts = [];
    
    // Alerta: Gastos maiores que renda média (NOVO)
    if (avgExpenses > avgIncome && avgIncome > 0) {
      alerts.push({
        type: 'danger',
        icon: <AlertTriangle className="w-4 h-4" />,
        title: 'Atenção: Gastos acima da renda',
        message: `Seus gastos médios (R$ ${avgExpenses.toFixed(2)}) estão maiores que sua renda média (R$ ${avgIncome.toFixed(2)}).`
      });
    }
    
    // Alerta: Gasto acima da média
    if (currentMonthExpenses > avgExpenses * 1.15) {
      alerts.push({
        type: 'warning',
        icon: <AlertTriangle className="w-4 h-4" />,
        title: 'Gastos acima da média',
        message: `Você gastou R$ ${currentMonthExpenses.toFixed(2)} este mês, ${((currentMonthExpenses / avgExpenses - 1) * 100).toFixed(0)}% acima da sua média.`
      });
    }
    
    // Alerta: Risco financeiro (cenário conservador)
    if (projections.conservative.in3Months < 0 || projections.conservative.in6Months < 0) {
      alerts.push({
        type: 'danger',
        icon: <AlertTriangle className="w-4 h-4" />,
        title: 'Risco financeiro detectado',
        message: 'Mesmo no cenário conservador, seu saldo ficará negativo em breve. Ajuste urgente necessário!'
      });
    } else if (projections.realistic.in3Months < 0 || projections.realistic.in6Months < 0) {
      alerts.push({
        type: 'warning',
        icon: <AlertTriangle className="w-4 h-4" />,
        title: 'Atenção ao cenário realista',
        message: 'Mantendo esse padrão, seu saldo ficará negativo em breve.'
      });
    }
    
    // Alerta: Evolução positiva (NOVO - comparado com saldo atual)
    if (projections.realistic.in3Months > totals.balance && avgIncome > avgExpenses) {
      alerts.push({
        type: 'success',
        icon: <TrendingUp className="w-4 h-4" />,
        title: 'Parabéns! Você está evoluindo',
        message: `Seu saldo está crescendo. Continue assim e terá R$ ${projections.realistic.in12Months.toFixed(2)} em 12 meses!`
      });
    }
    
    // Alerta: Evolução positiva (redução de gastos)
    if (lastMonthExpenses > 0 && currentMonthExpenses < lastMonthExpenses * 0.9) {
      alerts.push({
        type: 'success',
        icon: <TrendingDown className="w-4 h-4" />,
        title: 'Economia! Gastos reduziram',
        message: `Seus gastos caíram ${((1 - currentMonthExpenses / lastMonthExpenses) * 100).toFixed(0)}% em relação ao mês passado.`
      });
    }
    
    // Alerta: Categoria específica acima da média
    Object.entries(categoryComparison).forEach(([cat, data]) => {
      if (data.aboveAverage && data.current > 100) {
        alerts.push({
          type: 'warning',
          icon: CATEGORIES[cat]?.icon,
          title: `${cat} acima do normal`,
          message: `R$ ${data.current.toFixed(2)} (média: R$ ${data.avg.toFixed(2)})`
        });
      }
    });
    
    return {
      avgIncome,
      avgExpenses,
      avgBalance,
      avgByCategory,
      currentMonthExpenses,
      currentMonthIncome,
      lastMonthExpenses,
      categoryComparison,
      projections,
      incomeScenarios,
      alerts
    };
  }, [transactions, totals.balance]);

  // --- CÁLCULO DE FATURAS DE CARTÃO ---
  const creditCardBills = useMemo(() => {
    const now = new Date();
    const bills = {};
    
    creditCards.forEach(card => {
      // Inicializar faturas dos próximos 12 meses
      for (let i = 0; i < 12; i++) {
        const billDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const billKey = `${card.firestoreId}-${billDate.getFullYear()}-${billDate.getMonth()}`;
        
        bills[billKey] = {
          cardId: card.firestoreId,
          cardName: card.name,
          month: billDate.getMonth(),
          year: billDate.getFullYear(),
          total: 0,
          purchases: [],
          limit: card.limit,
          closingDay: card.closingDay,
          dueDay: card.dueDay
        };
      }
    });
    
    // Processar todas as compras parceladas
    cardPurchases.forEach(purchase => {
      const purchaseDate = new Date(purchase.purchaseDate);
      const installmentValue = purchase.amount / purchase.installments;
      const card = creditCards.find(c => c.firestoreId === purchase.cardId);
      
      if (!card) return;
      
      for (let i = 0; i < purchase.installments; i++) {
        // Determinar em qual fatura a parcela cai
        let billMonth = purchaseDate.getMonth();
        let billYear = purchaseDate.getFullYear();
        
        // Se a compra foi depois do fechamento, vai para a próxima fatura
        if (purchaseDate.getDate() > card.closingDay) {
          billMonth++;
          if (billMonth > 11) {
            billMonth = 0;
            billYear++;
          }
        }
        
        // Adicionar os meses das parcelas (i)
        billMonth += i;
        while (billMonth > 11) {
          billMonth -= 12;
          billYear++;
        }
        
        const billKey = `${purchase.cardId}-${billYear}-${billMonth}`;
        
        if (bills[billKey]) {
          bills[billKey].total += installmentValue;
          bills[billKey].purchases.push({
            ...purchase,
            installmentNumber: i + 1,
            installmentValue
          });
        }
      }
    });
    
    return Object.values(bills);
  }, [creditCards, cardPurchases]);

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
    let txType = newTx.type;
    
    // Auto-categorização apenas para despesas
    if (txType === 'expense') {
      AUTO_RULES.forEach(r => { 
        if(r.keywords.some(k => newTx.description.toLowerCase().includes(k))) {
          cat = r.category;
        }
      });
    }
    
    const baseTransaction = {
      description: newTx.description,
      amount: parseFloat(newTx.amount),
      type: txType,
      category: txType === 'income' ? 'Renda' : cat,
      date: newTx.date,
      recurring: newTx.recurring,
      tags: newTx.tags || [],
      createdAt: Date.now()
    };

    // Se for parcelado, criar múltiplas transações
    if (newTx.installments > 1) {
      const installmentAmount = parseFloat(newTx.amount) / newTx.installments;
      for (let i = 0; i < newTx.installments; i++) {
        const installmentDate = new Date(newTx.date);
        installmentDate.setMonth(installmentDate.getMonth() + i);
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'transactions'), {
          ...baseTransaction,
          amount: installmentAmount,
          date: installmentDate.toISOString().split('T')[0],
          description: `${newTx.description} (${i+1}/${newTx.installments})`,
          installment: { current: i+1, total: newTx.installments }
        });
      }
    } else {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'transactions'), baseTransaction);
    }

    setShowAddModal(false); 
    setNewTx({ description: '', amount: '', category: 'Alimentação', date: new Date().toISOString().split('T')[0], recurring: false, type: 'expense', tags: [], installments: 1 });
  };

  const handleEditTransaction = async () => {
    if (!editingTx || !user) return;
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'transactions', editingTx.firestoreId), {
      description: editingTx.description,
      amount: parseFloat(editingTx.amount),
      category: editingTx.category,
      date: editingTx.date,
      tags: editingTx.tags || []
    });
    setShowEditModal(false);
    setEditingTx(null);
  };

  const handleDeleteTransaction = async (txId) => {
    if (!user || !confirm('Tem certeza que deseja remover esta transação?')) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'transactions', txId));
  };

  const handleAddGoal = async () => {
    if (!newGoal.name || !newGoal.target || !user) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'goals'), {
      name: newGoal.name, 
      target: parseFloat(newGoal.target), 
      current: parseFloat(newGoal.current), 
      deadline: newGoal.deadline,
      monthlyContribution: parseFloat(newGoal.monthlyContribution) || 0
    });
    setShowGoalModal(false); setNewGoal({ name: '', target: '', current: '0', deadline: '', monthlyContribution: '' });
  };

  const handleUpdateGoalProgress = async (goalId, additionalAmount) => {
    const goal = goals.find(g => g.firestoreId === goalId);
    if (!goal || !user) return;
    const newCurrent = goal.current + parseFloat(additionalAmount);
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'goals', goalId), {
      current: newCurrent
    });
  };

  const handleAddBudget = async () => {
    if (!newBudget.limit || !user) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'budgets'), {
      category: newBudget.category,
      limit: parseFloat(newBudget.limit)
    });
    setShowBudgetModal(false);
    setNewBudget({ category: 'Alimentação', limit: '' });
  };

  const handleDeleteBudget = async (budgetId) => {
    if (!user || !confirm('Tem certeza que deseja remover este orçamento?')) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'budgets', budgetId));
      // Atualização otimista do estado local
      setBudgets(prev => prev.filter(b => b.firestoreId !== budgetId));
    } catch (error) {
      console.error('Erro ao deletar orçamento:', error);
      alert('Erro ao remover orçamento. Tente novamente.');
    }
  };

  const handleAddReminder = async () => {
    if (!newReminder.name || !newReminder.amount || !newReminder.dueDay || !user) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'reminders'), {
      name: newReminder.name,
      amount: parseFloat(newReminder.amount),
      dueDay: parseInt(newReminder.dueDay),
      category: newReminder.category,
      dueMonth: parseInt(newReminder.dueMonth),
      dueYear: parseInt(newReminder.dueYear),
      recurring: newReminder.recurring
    });
    setShowReminderModal(false);
    setNewReminder({ 
      name: '', 
      amount: '', 
      dueDay: '', 
      category: 'Moradia',
      dueMonth: new Date().getMonth(),
      dueYear: new Date().getFullYear(),
      recurring: false
    });
  };

  const handleDeleteReminder = async (reminderId) => {
    if (!user || !confirm('Tem certeza que deseja remover este lembrete?')) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'reminders', reminderId));
  };

  const handlePayReminder = async (reminder) => {
    if (!user || !confirm(`Confirma o pagamento de ${reminder.name} - R$ ${reminder.amount.toFixed(2)}?`)) return;
    
    try {
      // Cria a transação de pagamento
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'transactions'), {
        description: reminder.name,
        amount: parseFloat(reminder.amount),
        category: reminder.category || 'Moradia',
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
        recurring: false,
        tags: ['conta-paga']
      });
      
      // Se for recorrente, avança para próximo mês. Se não, deleta
      if (reminder.recurring) {
        const currentMonth = reminder.dueMonth ?? new Date().getMonth();
        const currentYear = reminder.dueYear ?? new Date().getFullYear();
        const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
        
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'reminders', reminder.firestoreId), {
          dueMonth: nextMonth,
          dueYear: nextYear
        });
      } else {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'reminders', reminder.firestoreId));
      }
      
    } catch (error) {
      console.error('Erro ao pagar conta:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    }
  };

  // --- FUNÇÕES DE CARTÃO DE CRÉDITO ---
  const handleAddCard = async () => {
    if (!newCard.name || !newCard.limit || !newCard.closingDay || !newCard.dueDay || !user) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'creditCards'), {
      name: newCard.name,
      limit: parseFloat(newCard.limit),
      closingDay: parseInt(newCard.closingDay),
      dueDay: parseInt(newCard.dueDay),
      brand: newCard.brand || ''
    });
    setShowCardModal(false);
    setNewCard({ name: '', limit: '', closingDay: '', dueDay: '', brand: '' });
  };

  const handleDeleteCard = async (cardId) => {
    if (!user || !confirm('Tem certeza que deseja remover este cartão? As compras associadas também serão removidas.')) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'creditCards', cardId));
      // Remover compras associadas ao cartão
      const purchasesToDelete = cardPurchases.filter(p => p.cardId === cardId);
      for (const purchase of purchasesToDelete) {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'cardPurchases', purchase.firestoreId));
      }
    } catch (error) {
      console.error('Erro ao deletar cartão:', error);
      alert('Erro ao remover cartão. Tente novamente.');
    }
  };

  const handleAddCardPurchase = async () => {
    if (!newCardPurchase.description || !newCardPurchase.amount || !newCardPurchase.cardId || !user) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'cardPurchases'), {
      description: newCardPurchase.description,
      amount: parseFloat(newCardPurchase.amount),
      installments: parseInt(newCardPurchase.installments),
      cardId: newCardPurchase.cardId,
      purchaseDate: newCardPurchase.purchaseDate,
      category: newCardPurchase.category
    });
    setShowCardPurchaseModal(false);
    setNewCardPurchase({ 
      description: '', 
      amount: '', 
      installments: 1, 
      cardId: '', 
      purchaseDate: new Date().toISOString().split('T')[0],
      category: 'Alimentação'
    });
  };

  const handleDeleteCardPurchase = async (purchaseId) => {
    if (!user || !confirm('Tem certeza que deseja remover esta compra?')) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'cardPurchases', purchaseId));
  };

  // --- FUNÇÕES DE INVESTIMENTOS ---
  const handleAddInvestment = async () => {
    if (!newInvestment.name || !newInvestment.currentValue || !user) return;
    
    const investmentData = {
      name: newInvestment.name,
      type: newInvestment.type,
      currentValue: parseFloat(newInvestment.currentValue),
      initialValue: parseFloat(newInvestment.initialValue || newInvestment.currentValue),
      isExisting: newInvestment.isExisting,
      date: newInvestment.date,
      notes: newInvestment.notes || '',
      annualRate: parseFloat(newInvestment.annualRate) || 0,
      rateType: newInvestment.rateType || 'fixa',
      autoCalculate: newInvestment.autoCalculate !== false,
      createdAt: Date.now()
    };

    // Salvar o investimento
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'investments'), investmentData);

    // Se NÃO é um investimento existente (é um novo aporte), criar uma transação de saída
    if (!newInvestment.isExisting) {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'transactions'), {
        description: `Aporte: ${newInvestment.name}`,
        amount: parseFloat(newInvestment.currentValue),
        type: 'expense',
        category: 'Investimentos',
        date: newInvestment.date,
        recurring: false,
        tags: ['investimento', 'aporte'],
        createdAt: Date.now()
      });
    }

    setShowInvestmentModal(false);
    setNewInvestment({
      name: '',
      type: 'Renda Fixa',
      currentValue: '',
      initialValue: '',
      isExisting: true,
      date: new Date().toISOString().split('T')[0],
      notes: '',
      annualRate: '',
      rateType: 'fixa',
      autoCalculate: true
    });
  };

  const handleUpdateInvestmentValue = async (investmentId, newValue) => {
    if (!user) return;
    const investment = investments.find(i => i.firestoreId === investmentId);
    if (!investment) return;
    
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'investments', investmentId), {
      currentValue: parseFloat(newValue),
      lastUpdated: Date.now()
    });
  };

  const handleAddToInvestment = async (investmentId, amount) => {
    if (!user || !amount) return;
    const investment = investments.find(i => i.firestoreId === investmentId);
    if (!investment) return;
    
    const addAmount = parseFloat(amount);
    
    // Atualizar o investimento
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'investments', investmentId), {
      currentValue: investment.currentValue + addAmount,
      initialValue: investment.initialValue + addAmount,
      lastUpdated: Date.now()
    });
    
    // Criar transação de saída (aporte)
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'transactions'), {
      description: `Aporte: ${investment.name}`,
      amount: addAmount,
      type: 'expense',
      category: 'Investimentos',
      date: new Date().toISOString().split('T')[0],
      recurring: false,
      tags: ['investimento', 'aporte'],
      createdAt: Date.now()
    });
  };

  const handleWithdrawFromInvestment = async (investmentId, amount) => {
    if (!user || !amount) return;
    const investment = investments.find(i => i.firestoreId === investmentId);
    if (!investment) return;
    
    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount > investment.currentValue) {
      alert('Valor de resgate maior que o saldo do investimento!');
      return;
    }
    
    // Atualizar o investimento
    const newValue = investment.currentValue - withdrawAmount;
    if (newValue <= 0) {
      // Se zerou, deletar o investimento
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'investments', investmentId));
    } else {
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'investments', investmentId), {
        currentValue: newValue,
        lastUpdated: Date.now()
      });
    }
    
    // Criar transação de entrada (resgate)
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'transactions'), {
      description: `Resgate: ${investment.name}`,
      amount: withdrawAmount,
      type: 'income',
      category: 'Investimentos',
      date: new Date().toISOString().split('T')[0],
      recurring: false,
      tags: ['investimento', 'resgate'],
      createdAt: Date.now()
    });
  };

  const handleDeleteInvestment = async (investmentId) => {
    if (!user || !confirm('Tem certeza que deseja remover este investimento? Isso NÃO afetará seu saldo.')) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'investments', investmentId));
    } catch (error) {
      console.error('Erro ao deletar investimento:', error);
      alert('Erro ao remover investimento. Tente novamente.');
    }
  };

  const handlePayBill = async (card, billTotal, month, year) => {
    if (!user || billTotal === 0) return;
    if (!confirm(`Confirmar pagamento da fatura do ${card.name}?\nValor: R$ ${billTotal.toFixed(2)}`)) return;
    
    try {
      // Criar transação de despesa para registrar o pagamento da fatura
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'transactions'), {
        description: `Fatura ${card.name}`,
        amount: billTotal,
        category: 'Dívidas',
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
        recurring: false,
        tags: ['cartao-credito', 'fatura']
      });
      
      // Atualizar compras parceladas - decrementar parcelas e ajustar valor
      const purchasesToUpdate = cardPurchases.filter(p => p.cardId === card.firestoreId);
      
      for (const purchase of purchasesToUpdate) {
        const purchaseDate = new Date(purchase.purchaseDate);
        const installmentAmount = purchase.amount / purchase.installments;
        
        // Calcular em qual fatura a primeira parcela cai
        let billMonth = purchaseDate.getMonth();
        let billYear = purchaseDate.getFullYear();
        
        // Se a compra foi depois do fechamento, vai para a próxima fatura
        if (purchaseDate.getDate() > card.closingDay) {
          billMonth++;
          if (billMonth > 11) {
            billMonth = 0;
            billYear++;
          }
        }
        
        // Verificar todas as parcelas para encontrar qual está nesta fatura
        for (let i = 0; i < purchase.installments; i++) {
          let tempMonth = billMonth + i;
          let tempYear = billYear;
          
          while (tempMonth > 11) {
            tempMonth -= 12;
            tempYear++;
          }
          
          if (tempMonth === month && tempYear === year) {
            // Esta fatura contém a parcela (i+1) desta compra
            const newInstallments = purchase.installments - 1;
            const newAmount = installmentAmount * newInstallments;
            
            if (newInstallments === 0) {
              // Última parcela - deletar compra
              await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'cardPurchases', purchase.firestoreId));
            } else {
              // Ainda tem parcelas - atualizar quantidade e valor
              // A próxima parcela será no mês seguinte
              let nextMonth = month + 1;
              let nextYear = year;
              if (nextMonth > 11) {
                nextMonth = 0;
                nextYear++;
              }
              
              // Ajustar a data da compra para refletir que essa parcela foi paga
              // Nova data: fechamento do mês anterior à próxima parcela
              const newPurchaseDate = new Date(nextYear, nextMonth, card.closingDay - 1);
              
              await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'cardPurchases', purchase.firestoreId), {
                installments: newInstallments,
                amount: newAmount,
                purchaseDate: newPurchaseDate.toISOString().split('T')[0]
              });
            }
            break;
          }
        }
      }
      
      alert(`Fatura paga! R$ ${billTotal.toFixed(2)} foi debitado do seu saldo.`);
    } catch (error) {
      console.error('Erro ao pagar fatura:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!user || !confirm('Tem certeza que deseja remover esta meta?')) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'goals', goalId));
      setGoals(prev => prev.filter(g => g.firestoreId !== goalId));
    } catch (error) {
      console.error('Erro ao deletar meta:', error);
      alert('Erro ao remover meta. Tente novamente.');
    }
  };

  const exportToCSV = () => {
    const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Tags'];
    const rows = transactions.map(tx => [
      tx.date,
      tx.description,
      tx.category,
      tx.type === 'income' ? 'Entrada' : 'Saída',
      tx.amount.toFixed(2),
      (tx.tags || []).join('; ')
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `zenfinance-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(l => l.trim());
      
      // Formato esperado: data, descrição, valor (simples)
      for (const line of lines) {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 3) {
          const [date, description, amount] = parts;
          const numAmount = parseFloat(amount.replace(/[^\d.-]/g, ''));
          if (!isNaN(numAmount) && description) {
            await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'transactions'), {
              description,
              amount: Math.abs(numAmount),
              type: numAmount >= 0 ? 'income' : 'expense',
              category: numAmount >= 0 ? 'Renda' : 'Alimentação',
              date: date || new Date().toISOString().split('T')[0],
              tags: [],
              createdAt: Date.now()
            });
          }
        }
      }
    };
    reader.readAsText(file);
    setShowUploadModal(false);
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white"/>
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-800">ZenFinance</h1>
                <p className="text-[10px] text-slate-400">{user?.email?.split('@')[0]}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowUploadModal(true)} className="p-2 bg-slate-50 rounded-lg hover:bg-slate-100 active:scale-95 transition-all" title="Importar">
                <ArrowRight className="w-4 h-4 text-slate-600"/>
              </button>
              <button onClick={handleLogout} className="p-2 bg-slate-50 rounded-lg hover:bg-rose-50 hover:text-rose-600 active:scale-95 transition-all" title="Sair">
                <LogOut className="w-4 h-4 text-slate-600"/>
              </button>
            </div>
          </div>
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
                <h2 className="text-4xl font-bold mt-2 tracking-tight">R$ {totalPatrimony.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                <div className="flex gap-2 mt-4 flex-wrap">
                   <div className="bg-white/10 px-3 py-2 rounded-xl flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-blue-300"/> 
                      <span className="text-xs font-semibold">Saldo: R$ {totals.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                   </div>
                   <div className="bg-white/10 px-3 py-2 rounded-xl flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-300"/> 
                      <span className="text-xs font-semibold">Invest: R$ {investmentTotals.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                   </div>
                </div>
                <div className="flex gap-2 mt-2">
                   <div className="bg-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-emerald-300"/> 
                      <span className="text-[10px] font-medium">+R$ {totals.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                   </div>
                   <div className="bg-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2">
                      <TrendingDown className="w-3 h-3 text-rose-300"/> 
                      <span className="text-[10px] font-medium">-R$ {totals.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
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
                        <div className="flex-1">
                          <p className="font-bold text-slate-800">{goal.name}</p>
                          {goal.deadline && (
                            <p className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3"/> Até {new Date(goal.deadline).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <button 
                          onClick={() => {
                            const amount = prompt('Quanto você conseguiu guardar para esta meta?');
                            if (amount && !isNaN(amount)) handleUpdateGoalProgress(goal.firestoreId, amount);
                          }}
                          className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg font-semibold hover:bg-emerald-200 transition-colors"
                        >
                          + Adicionar
                        </button>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                        <div className="h-full bg-indigo-500" style={{width: `${Math.min((goal.current/goal.target)*100, 100)}%`}}></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-600">R$ {goal.current.toFixed(0)} de R$ {goal.target.toFixed(0)}</span>
                        <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded-lg">
                          {Math.round((goal.current/goal.target)*100)}%
                        </span>
                      </div>
                      {monthlyNeed !== null && monthlyNeed > 0 && (
                        <p className="text-xs text-indigo-600 font-medium bg-indigo-50 p-2 rounded-lg mt-2">
                          💡 Guarde <b>R$ {monthlyNeed.toFixed(0)}/mês</b> para atingir
                        </p>
                      )}
                    </div>
                  );
                })}
                {goals.length === 0 && <p className="text-center text-slate-400 text-sm py-4">Adicione uma meta para começar a planejar.</p>}
              </div>
            </section>

            {/* Orçamentos */}
            {budgetStatus.length > 0 && (
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2"><Calculator className="w-5 h-5 text-indigo-500"/> Orçamentos do Mês</h3>
                  <button onClick={() => setShowBudgetModal(true)} className="text-indigo-600 text-xs font-bold bg-indigo-50 px-3 py-1 rounded-full">+ Novo</button>
                </div>
                <div className="space-y-3">
                  {budgetStatus.map(budget => (
                    <div key={budget.firestoreId} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          {CATEGORIES[budget.category]?.icon}
                          <span className="font-bold text-slate-800">{budget.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${budget.percentage > 100 ? 'bg-rose-100 text-rose-700' : budget.percentage > 80 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {budget.percentage.toFixed(0)}%
                          </span>
                          <button 
                            onClick={() => handleDeleteBudget(budget.firestoreId)}
                            className="p-1.5 hover:bg-rose-50 active:bg-rose-100 rounded-lg transition-colors"
                            title="Remover orçamento"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-rose-500"/>
                          </button>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                        <div 
                          className={`h-full ${budget.percentage > 100 ? 'bg-rose-500' : budget.percentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{width: `${Math.min(budget.percentage, 100)}%`}}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-600">
                        <b>R$ {budget.spent.toFixed(2)}</b> de R$ {budget.limit.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Lembretes de Contas */}
            {reminders.length > 0 && (
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500"/> Contas a Pagar</h3>
                  <button onClick={() => setShowReminderModal(true)} className="text-indigo-600 text-xs font-bold bg-indigo-50 px-3 py-1 rounded-full">+ Novo</button>
                </div>
                <div className="space-y-2">
                  {reminders.map(reminder => {
                    const today = new Date();
                    const currentMonth = today.getMonth();
                    const currentYear = today.getFullYear();
                    const currentDay = today.getDate();
                    
                    const dueMonth = reminder.dueMonth ?? currentMonth;
                    const dueYear = reminder.dueYear ?? currentYear;
                    
                    // Calcular se está atrasado ou próximo
                    const isPast = dueYear < currentYear || 
                                  (dueYear === currentYear && dueMonth < currentMonth) ||
                                  (dueYear === currentYear && dueMonth === currentMonth && reminder.dueDay < currentDay);
                    
                    const isCurrentMonth = dueYear === currentYear && dueMonth === currentMonth;
                    const daysUntil = isCurrentMonth ? reminder.dueDay - currentDay : null;
                    const isNear = daysUntil !== null && daysUntil >= 0 && daysUntil <= 5;
                    
                    const monthName = new Date(dueYear, dueMonth, 1).toLocaleDateString('pt-BR', { month: 'short' });
                    
                    return (
                      <div key={reminder.firestoreId} className={`p-3 rounded-xl flex items-center gap-3 ${isPast ? 'bg-rose-50 border border-rose-200' : isNear ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-slate-100'}`}>
                        <div className={`p-2 rounded-lg ${isPast ? 'bg-rose-100' : isNear ? 'bg-amber-100' : 'bg-slate-100'}`}>
                          {CATEGORIES[reminder.category]?.icon || <DollarSign className="w-4 h-4"/>}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{reminder.name}</p>
                          <p className="text-xs text-slate-500">
                            {reminder.dueDay}/{monthName}/{dueYear} • R$ {reminder.amount.toFixed(2)}
                            {isPast && <span className="text-rose-600 font-bold ml-2">• Atrasado!</span>}
                            {isNear && !isPast && <span className="text-amber-600 font-bold ml-2">• Falta {daysUntil} dia{daysUntil !== 1 ? 's' : ''}</span>}
                          </p>
                        </div>
                        <button 
                          onClick={() => handleDeleteReminder(reminder.firestoreId)}
                          className="p-2 hover:bg-rose-50 active:bg-rose-100 rounded-lg transition-colors"
                          title="Remover lembrete"
                        >
                          <Trash2 className="w-4 h-4 text-slate-400 hover:text-rose-500"/>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Histórico de Transações */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2"><Wallet className="w-5 h-5 text-indigo-500"/> Transações</h3>
                <div className="flex gap-2">
                  <button onClick={() => setShowFilters(!showFilters)} className={`text-xs font-bold px-3 py-1 rounded-full ${showFilters ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                    Filtros
                  </button>
                  <button onClick={exportToCSV} className="text-xs font-bold bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full">
                    Exportar
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="bg-white p-4 rounded-2xl border border-slate-100 mb-4 space-y-3">
                  <input 
                    type="text"
                    placeholder="Buscar transação..."
                    className="w-full bg-slate-50 p-3 rounded-xl border-none text-sm"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <select className="flex-1 bg-slate-50 p-2 rounded-xl text-sm border-none" value={filterType} onChange={e => setFilterType(e.target.value)}>
                      <option value="all">Todos os tipos</option>
                      <option value="income">Entradas</option>
                      <option value="expense">Saídas</option>
                    </select>
                    <select className="flex-1 bg-slate-50 p-2 rounded-xl text-sm border-none" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                      <option value="all">Todas categorias</option>
                      {Object.keys(CATEGORIES).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {groupedTransactions.slice(0, Math.ceil(transactionsToShow / 10)).map(group => (
                  <div key={group.key}>
                    {/* Cabeçalho do Mês */}
                    <div className="flex items-center gap-3 mb-3 sticky top-20 bg-slate-50 py-2 z-10">
                      <div className="flex-1 h-px bg-slate-200"></div>
                      <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-200">
                        <Calendar className="w-3 h-3 text-indigo-500"/>
                        <span className="text-xs font-bold text-slate-700 capitalize">{group.label}</span>
                        {group.total > 0 && (
                          <span className="text-xs text-rose-600 font-medium">
                            R$ {group.total.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 h-px bg-slate-200"></div>
                    </div>

                    {/* Transações do Mês */}
                    <div className="space-y-2">
                      {group.transactions.map(tx => (
                        <div key={tx.firestoreId} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg shrink-0 ${tx.type === 'income' ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                              {CATEGORIES[tx.category]?.icon || <DollarSign className="w-4 h-4"/>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-slate-800 truncate">{tx.description}</p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString('pt-BR')}</span>
                                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{tx.category}</span>
                                {tx.recurring && <RefreshCw className="w-3 h-3 text-indigo-500"/>}
                                {tx.installment && <span className="text-xs text-slate-500">{tx.installment.current}/{tx.installment.total}x</span>}
                                {(tx.tags || []).map(tag => (
                                  <span key={tag} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">#{tag}</span>
                                ))}
                              </div>
                              <div className={`font-bold text-base mt-1 ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                                {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <button 
                                onClick={() => { setEditingTx(tx); setShowEditModal(true); }}
                                className="p-2 hover:bg-indigo-50 active:bg-indigo-100 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Settings className="w-4 h-4 text-slate-400 hover:text-indigo-500"/>
                              </button>
                              <button 
                                onClick={() => handleDeleteTransaction(tx.firestoreId)}
                                className="p-2 hover:bg-rose-50 active:bg-rose-100 rounded-lg transition-colors"
                                title="Remover"
                              >
                                <Trash2 className="w-4 h-4 text-slate-400 hover:text-rose-500 active:text-rose-600"/>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {filteredTransactions.length === 0 && (
                  <p className="text-center text-slate-400 text-sm py-8">
                    {searchTerm || filterCategory !== 'all' || filterType !== 'all' 
                      ? 'Nenhuma transação encontrada com esses filtros.'
                      : 'Nenhuma transação ainda. Adicione sua primeira!'}
                  </p>
                )}

                {/* Botão Ver Mais / Ver Menos */}
                {filteredTransactions.length > 10 && (
                  <div className="pt-4">
                    {transactionsToShow < filteredTransactions.length ? (
                      <button 
                        onClick={() => setTransactionsToShow(prev => prev + 10)}
                        className="w-full py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        Ver mais transações ({filteredTransactions.length - transactionsToShow} restantes)
                        <ArrowRight className="w-4 h-4 rotate-90"/>
                      </button>
                    ) : (
                      <button 
                        onClick={() => setTransactionsToShow(10)}
                        className="w-full py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        Recolher lista
                        <ArrowRight className="w-4 h-4 -rotate-90"/>
                      </button>
                    )}
                    <p className="text-center text-xs text-slate-400 mt-2">
                      Mostrando {Math.min(transactionsToShow, filteredTransactions.length)} de {filteredTransactions.length} transações
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Atalho para Transações */}
            <button onClick={() => setShowAddModal(true)} className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
              <Plus className="w-5 h-5"/> Adicionar Transação
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

             {/* Gráfico de Pizza - Gastos por Categoria */}
             {categoryData.length > 0 && totals.expenses > 0 && (
               <div className="bg-white p-5 rounded-3xl border shadow-sm">
                 <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><PieChartIcon className="w-4 h-4"/> Gastos por Categoria</h3>
                 
                 {/* Visualização em Barras Empilhadas (mais simples que SVG) */}
                 <div className="mb-4">
                   <div className="h-8 rounded-full overflow-hidden flex">
                     {categoryData.map(([cat, amount]) => {
                       const percentage = (amount / totals.expenses) * 100;
                       const color = CATEGORIES[cat]?.color || 'bg-slate-400';
                       return (
                         <div 
                           key={cat}
                           className={`${color} flex items-center justify-center text-white text-[10px] font-bold`}
                           style={{ width: `${percentage}%` }}
                           title={`${cat}: ${percentage.toFixed(1)}%`}
                         >
                           {percentage > 8 && `${percentage.toFixed(0)}%`}
                         </div>
                       );
                     })}
                   </div>
                 </div>

                 {/* Lista detalhada */}
                 <div className="space-y-2">
                   {categoryData.map(([cat, amount]) => {
                     const percentage = (amount / totals.expenses) * 100;
                     const color = CATEGORIES[cat]?.color || 'bg-slate-400';
                     return (
                       <div key={cat} className="flex items-center gap-3">
                         <div className={`${color} p-2 rounded-lg`}>
                           {CATEGORIES[cat]?.icon || <DollarSign className="w-4 h-4 text-white"/>}
                         </div>
                         <div className="flex-1">
                           <div className="flex justify-between items-center mb-1">
                             <span className="text-sm font-semibold text-slate-700">{cat}</span>
                             <span className="text-xs font-bold text-slate-600">{percentage.toFixed(1)}%</span>
                           </div>
                           <div className="flex items-center gap-2">
                             <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                               <div className={`h-full ${color}`} style={{ width: `${percentage}%` }}></div>
                             </div>
                             <span className="text-xs text-slate-500 font-medium">R$ {amount.toFixed(2)}</span>
                           </div>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </div>
             )}

             {/* Heatmap Melhorado */}
             <div className="bg-white p-5 rounded-3xl border shadow-sm">
               <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                 <Map className="w-4 h-4"/> Mapa de Gastos do Mês
               </h3>
               
               {/* Top 3 dias com mais gastos */}
               {Object.entries(heatmapData).filter(([,val]) => val > 0).length > 0 && (
                 <div className="mb-4 p-3 bg-rose-50 rounded-xl">
                   <p className="text-xs font-bold text-rose-700 mb-2">🔥 Dias com maiores gastos:</p>
                   <div className="flex gap-2 flex-wrap">
                     {Object.entries(heatmapData)
                       .filter(([,val]) => val > 0)
                       .sort((a, b) => b[1] - a[1])
                       .slice(0, 3)
                       .map(([day, val]) => (
                         <div key={day} className="bg-white px-3 py-1 rounded-lg text-xs">
                           <span className="font-bold text-slate-700">Dia {day}:</span>{' '}
                           <span className="text-rose-600 font-bold">R$ {val.toFixed(2)}</span>
                         </div>
                       ))}
                   </div>
                 </div>
               )}

               <div className="grid grid-cols-7 gap-2 mb-3">
                 {Object.entries(heatmapData).map(([day, val]) => {
                   const maxValue = Math.max(...Object.values(heatmapData));
                   const intensity = maxValue > 0 ? Math.min(val / maxValue, 1) : 0;
                   const today = new Date().getDate();
                   const isToday = parseInt(day) === today;
                   
                   return (
                     <button
                       key={day}
                       onClick={() => setShowDayDetails(parseInt(day))}
                       className="flex flex-col items-center gap-1 group relative"
                     >
                       {/* Tooltip */}
                       <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                         {val === 0 ? 'Sem gastos' : `R$ ${val.toFixed(2)}`}
                         <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                       </div>
                       
                       <div 
                         className={`w-full aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold transition-all hover:scale-110 active:scale-95 ${isToday ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
                         style={{
                           backgroundColor: val === 0 ? '#f1f5f9' : `rgba(244, 63, 94, ${0.2 + intensity * 0.8})`,
                           color: val === 0 ? '#94a3b8' : val > maxValue * 0.6 ? 'white' : '#881337'
                         }}
                       >
                         {day}
                       </div>
                     </button>
                   );
                 })}
               </div>

               {/* Legenda */}
               <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2">
                 <span>Menos gastos</span>
                 <div className="flex gap-1">
                   {[0.2, 0.4, 0.6, 0.8, 1].map(intensity => (
                     <div 
                       key={intensity}
                       className="w-4 h-4 rounded"
                       style={{ backgroundColor: `rgba(244, 63, 94, ${0.2 + intensity * 0.8})` }}
                     ></div>
                   ))}
                 </div>
                 <span>Mais gastos</span>
               </div>
               
               <p className="text-[10px] text-slate-400 text-center">
                 💡 Clique em qualquer dia para ver os detalhes dos gastos
               </p>
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
             {/* Card de Instrução */}
             <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-5 rounded-3xl text-white shadow-lg">
               <div className="flex items-start gap-3">
                 <div className="bg-white/20 p-2 rounded-xl shrink-0">
                   <Map className="w-5 h-5"/>
                 </div>
                 <div className="flex-1">
                   <h3 className="font-bold mb-1">Como Usar a Aba Futuro</h3>
                   <p className="text-sm text-white/90 leading-relaxed">
                     Planeje sua vida financeira! Adicione suas <b>metas</b> de economia, 
                     registre <b>contas a pagar</b> para não esquecer e use o <b>simulador</b> 
                     para ver o impacto de decisões futuras (novo emprego, financiamento, etc).
                   </p>
                 </div>
               </div>
             </div>

             {/* Gráfico Linha do Tempo SVG */}
             <section className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-2xl overflow-hidden relative">
               <div className="flex justify-between items-end mb-3">
                 <div>
                   <h2 className="text-2xl font-bold">Projeção Financeira</h2>
                   <p className="text-slate-400 text-xs">Baseado na média dos últimos 3 meses</p>
                 </div>
                 <BarChart3 className="w-8 h-8 text-indigo-400 opacity-50"/>
               </div>

               {/* Cards de Média Mensal */}
               <div className="grid grid-cols-3 gap-2 mb-4">
                 <div className="bg-slate-800/50 rounded-xl p-2 border border-slate-700">
                   <p className="text-[10px] text-slate-400 mb-1">Receita Média/Mês</p>
                   <p className="text-sm font-bold text-emerald-400">
                     R$ {(transactions.filter(t => t.type === 'income' && new Date(t.date) >= new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1))
                       .reduce((acc, t) => acc + t.amount, 0) / Math.max(3, 1)).toFixed(0)}
                   </p>
                 </div>
                 <div className="bg-slate-800/50 rounded-xl p-2 border border-slate-700">
                   <p className="text-[10px] text-slate-400 mb-1">Gasto Médio/Mês</p>
                   <p className="text-sm font-bold text-rose-400">
                     R$ {(transactions.filter(t => t.type === 'expense' && new Date(t.date) >= new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1))
                       .reduce((acc, t) => acc + t.amount, 0) / Math.max(3, 1)).toFixed(0)}
                   </p>
                 </div>
                 <div className="bg-slate-800/50 rounded-xl p-2 border border-slate-700">
                   <p className="text-[10px] text-slate-400 mb-1">Saldo em 12 Meses</p>
                   <p className="text-sm font-bold text-indigo-400">
                     {timelineData.length > 0 && timelineData[12] ? (
                       `R$ ${timelineData[12].value.toFixed(0)}`
                     ) : 'R$ 0'}
                   </p>
                 </div>
               </div>
               
               {/* Info adicional */}
               <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2 mb-4">
                 <p className="text-[10px] text-emerald-300">
                   💰 <b>Próximo mês:</b> R$ {timelineData.length > 1 && timelineData[1] ? timelineData[1].value.toFixed(0) : '0'}
                   <span className="text-emerald-400/70 ml-2">
                     ({(transactions.filter(t => t.type === 'income' && new Date(t.date) >= new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1))
                       .reduce((acc, t) => acc + t.amount, 0) / Math.max(3, 1) - 
                       transactions.filter(t => t.type === 'expense' && new Date(t.date) >= new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1))
                       .reduce((acc, t) => acc + t.amount, 0) / Math.max(3, 1)) > 0 ? '+' : ''}
                     R$ {(transactions.filter(t => t.type === 'income' && new Date(t.date) >= new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1))
                       .reduce((acc, t) => acc + t.amount, 0) / Math.max(3, 1) - 
                       transactions.filter(t => t.type === 'expense' && new Date(t.date) >= new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1))
                       .reduce((acc, t) => acc + t.amount, 0) / Math.max(3, 1)).toFixed(0)}/mês)
                   </span>
                 </p>
               </div>
               
               {/* SVG Chart Area */}
               <div className="h-40 w-full relative bg-slate-800/30 rounded-xl p-3">
                 {timelineData.length > 0 ? (
                   <div className="h-full flex items-end justify-between gap-1">
                     {timelineData.map((point, i) => {
                       // Calcula progresso de 0 a 100%
                       const progress = (i / (timelineData.length - 1)) * 100;
                       // Altura cresce de 20% a 100%
                       const heightPercent = 20 + (progress * 0.8);
                       
                       return (
                         <div key={i} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                           {/* Tooltip */}
                           <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-lg">
                             Mês {point.month}<br/>R$ {point.value.toFixed(0)}
                           </div>
                           {/* Bar */}
                           <div 
                             className={`w-full rounded-t transition-all duration-300 ${i === 0 ? 'bg-emerald-500' : 'bg-indigo-500 group-hover:bg-indigo-400'}`}
                             style={{ height: `${heightPercent}%` }}
                           ></div>
                         </div>
                       );
                     })}
                   </div>
                 ) : (
                   <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                     Adicione transações para ver a projeção
                   </div>
                 )}
               </div>
               <div className="flex justify-between text-[10px] text-slate-500 mt-2">
                 <span>Hoje</span>
                 <span>6 Meses</span>
                 <span>1 Ano</span>
               </div>

               {/* Legenda explicativa */}
               <div className="mt-4 pt-4 border-t border-slate-800 flex gap-4 text-xs">
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded bg-emerald-500"></div>
                   <span className="text-slate-400">Saldo Atual</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded bg-indigo-500/60"></div>
                   <span className="text-slate-400">Projeção</span>
                 </div>
               </div>
             </section>

             {/* Metas de Economia */}
             <section className="bg-white p-5 rounded-3xl border shadow-sm">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold flex items-center gap-2"><Target className="w-4 h-4 text-indigo-500"/> Metas de Economia</h3>
                 <button onClick={() => setShowGoalModal(true)} className="text-indigo-600 text-xs font-bold bg-indigo-50 px-3 py-1 rounded-full">+ Nova Meta</button>
               </div>

               {goals.length === 0 ? (
                 <div className="text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                   <Target className="w-8 h-8 text-slate-300 mx-auto mb-2"/>
                   <p className="text-sm text-slate-500 font-medium">Nenhuma meta criada</p>
                   <p className="text-xs text-slate-400 mt-1">Crie uma meta para começar a economizar</p>
                 </div>
               ) : (
                 <div className="space-y-3">
                   {goals.map(goal => {
                     const percentage = (goal.current / goal.target) * 100;
                     const monthlySavings = calculateGoalSavings(goal);
                     const remaining = goal.target - goal.current;
                     const monthsToComplete = goal.monthlyContribution > 0 
                       ? Math.ceil(remaining / goal.monthlyContribution) 
                       : null;
                     
                     return (
                       <div key={goal.firestoreId} className="bg-gradient-to-br from-slate-50 to-white p-4 rounded-2xl border border-slate-100">
                         <div className="flex justify-between items-start mb-3">
                           <div className="flex-1">
                             <p className="font-bold text-slate-800">{goal.name}</p>
                             <p className="text-xs text-slate-500">
                               {goal.deadline && `Prazo: ${new Date(goal.deadline).toLocaleDateString('pt-BR')}`}
                             </p>
                             {goal.monthlyContribution > 0 && (
                               <div className="flex items-center gap-1 mt-1">
                                 <div className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                   💰 R$ {goal.monthlyContribution.toFixed(0)}/mês
                                 </div>
                                 {monthsToComplete && (
                                   <span className="text-[10px] text-emerald-600 font-medium">
                                     → Completa em {monthsToComplete} meses
                                   </span>
                                 )}
                               </div>
                             )}
                           </div>
                           <span className="text-xs font-bold px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg">
                             {percentage.toFixed(0)}%
                           </span>
                         </div>
                         
                         <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                           <div 
                             className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                             style={{width: `${Math.min(percentage, 100)}%`}}
                           ></div>
                         </div>
                         
                         <div className="flex justify-between items-center text-xs">
                           <span className="text-slate-600">
                             <b>R$ {goal.current.toFixed(2)}</b> de R$ {goal.target.toFixed(2)}
                           </span>
                           {!goal.monthlyContribution && monthlySavings > 0 && (
                             <span className="text-indigo-600 font-medium">
                               Economize R$ {monthlySavings.toFixed(2)}/mês
                             </span>
                           )}
                         </div>

                         <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                           <button 
                             onClick={() => {
                               const value = prompt('Quanto deseja adicionar?');
                               if (value) handleUpdateGoalProgress(goal.firestoreId, parseFloat(value));
                             }}
                             className="flex-1 bg-emerald-50 text-emerald-700 text-xs font-bold py-2 rounded-xl hover:bg-emerald-100 active:scale-95 transition-all"
                           >
                             + Adicionar Progresso
                           </button>
                           <button 
                             onClick={() => handleDeleteGoal(goal.firestoreId)}
                             className="px-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 active:scale-95 transition-all"
                             title="Remover meta"
                           >
                             <Trash2 className="w-4 h-4"/>
                           </button>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               )}
             </section>

             {/* Contas a Pagar (Lembretes) */}
             <section className="bg-white p-5 rounded-3xl border shadow-sm">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold flex items-center gap-2"><Bell className="w-4 h-4 text-amber-500"/> Contas a Pagar</h3>
                 <button onClick={() => setShowReminderModal(true)} className="text-amber-600 text-xs font-bold bg-amber-50 px-3 py-1 rounded-full">+ Nova Conta</button>
               </div>

               {reminders.length === 0 ? (
                 <div className="text-center py-8 bg-amber-50 rounded-2xl border-2 border-dashed border-amber-200">
                   <Bell className="w-8 h-8 text-amber-300 mx-auto mb-2"/>
                   <p className="text-sm text-amber-700 font-medium">Nenhuma conta cadastrada</p>
                   <p className="text-xs text-amber-600 mt-1">Adicione contas recorrentes para não esquecer</p>
                 </div>
               ) : (
                 <div className="space-y-3">
                   {reminders.map(reminder => {
                     const today = new Date();
                     const currentMonth = today.getMonth();
                     const currentYear = today.getFullYear();
                     const currentDay = today.getDate();
                     
                     const dueMonth = reminder.dueMonth ?? currentMonth;
                     const dueYear = reminder.dueYear ?? currentYear;
                     
                     const isPast = dueYear < currentYear || 
                                   (dueYear === currentYear && dueMonth < currentMonth) ||
                                   (dueYear === currentYear && dueMonth === currentMonth && reminder.dueDay < currentDay);
                     
                     const isCurrentMonth = dueYear === currentYear && dueMonth === currentMonth;
                     const daysUntil = isCurrentMonth ? reminder.dueDay - currentDay : null;
                     const isUrgent = daysUntil !== null && daysUntil >= 0 && daysUntil <= 5;
                     
                     const monthName = new Date(dueYear, dueMonth, 1).toLocaleDateString('pt-BR', { month: 'long' });
                     
                     return (
                       <div key={reminder.firestoreId} className={`p-4 rounded-2xl border-2 ${isPast ? 'bg-rose-50 border-rose-200' : isUrgent ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                         <div className="flex justify-between items-start mb-2">
                           <div className="flex-1">
                             <p className="font-bold text-slate-800">{reminder.name}</p>
                             <p className="text-xs text-slate-500 mt-1">
                               Vence em {reminder.dueDay} de {monthName} de {dueYear}
                               {isPast && <span className="text-rose-600 font-bold ml-2">• Atrasado!</span>}
                               {isUrgent && !isPast && <span className="text-amber-600 font-bold ml-2">• Próximo!</span>}
                             </p>
                           </div>
                           <button 
                             onClick={() => handleDeleteReminder(reminder.firestoreId)}
                             className="p-2 hover:bg-white rounded-lg transition-colors"
                             title="Remover lembrete"
                           >
                             <Trash2 className="w-4 h-4 text-slate-400 hover:text-rose-500"/>
                           </button>
                         </div>
                         <div className="flex items-center justify-between mb-3">
                           <span className={`text-lg font-bold ${isPast ? 'text-rose-600' : isUrgent ? 'text-amber-600' : 'text-slate-700'}`}>
                             R$ {reminder.amount.toFixed(2)}
                           </span>
                           {daysUntil !== null && daysUntil >= 0 && (
                             <span className="text-xs bg-white px-2 py-1 rounded-full font-medium text-slate-600">
                               {daysUntil === 0 ? 'Hoje!' : `${daysUntil} dia${daysUntil > 1 ? 's' : ''}`}
                             </span>
                           )}
                         </div>
                         <button 
                           onClick={() => handlePayReminder(reminder)}
                           className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-2"
                         >
                           <DollarSign className="w-4 h-4"/> Pagar Agora
                         </button>
                       </div>
                     );
                   })}
                 </div>
               )}
             </section>

             {/* Simulador de Decisões */}
             <section className="bg-white p-5 rounded-3xl border shadow-sm">
               <h3 className="font-bold mb-2 flex items-center gap-2"><Calculator className="w-4 h-4 text-indigo-500"/> Simulador de Decisões</h3>
               <p className="text-xs text-slate-500 mb-4">Teste o impacto de mudanças futuras na sua projeção financeira</p>
               
               {customScenarios.length === 0 && (
                 <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-4">
                   <p className="text-xs text-indigo-700">
                     💡 <b>Exemplo:</b> Adicione "+1500" para "Promoção" ou "-800" para "Novo Aluguel" e veja a mudança no gráfico acima!
                   </p>
                 </div>
               )}

               <div className="space-y-3 mb-4">
                 {customScenarios.map(scen => (
                   <div key={scen.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                     <span className="text-sm font-medium">{scen.name}</span>
                     <div className="flex items-center gap-3">
                       <span className={`text-sm font-bold ${scen.value > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                         {scen.value > 0 ? '+' : ''}R$ {scen.value}/mês
                       </span>
                       <button onClick={() => removeScenario(scen.id)}><X className="w-4 h-4 text-slate-300 hover:text-rose-500"/></button>
                     </div>
                   </div>
                 ))}
               </div>

               <div className="space-y-2">
                 <input 
                   placeholder="Ex: Novo Emprego" 
                   className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                   value={newScenario.name}
                   onChange={e => setNewScenario({...newScenario, name: e.target.value})}
                 />
                 <input 
                   placeholder="Valor (ex: +1500 ou -800)" 
                   type="number"
                   className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                   value={newScenario.value}
                   onChange={e => setNewScenario({...newScenario, value: e.target.value})}
                 />
                 <button onClick={handleAddScenario} className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                   <Plus className="w-5 h-5"/> Adicionar Cenário
                 </button>
               </div>
               <p className="text-[10px] text-slate-400 mt-2">Use valores positivos para ganhos (+) e negativos para gastos (-)</p>
             </section>
          </div>
        )}

        {/* === PREVISIBILIDADE === */}
        {activeTab === 'predictability' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Header da Seção */}
            <section className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6"/> Se você continuar assim...
                </h2>
                <p className="text-purple-100 text-sm">Previsão baseada nos seus últimos 3 meses</p>
              </div>
              <Sparkles className="absolute -top-4 -right-4 w-32 h-32 text-white/5" />
            </section>

            {/* Alertas Inteligentes */}
            {predictability.alerts.length > 0 && (
              <section>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-500"/> Alertas Inteligentes
                </h3>
                <div className="space-y-2">
                  {predictability.alerts.map((alert, idx) => (
                    <div 
                      key={idx}
                      className={`p-4 rounded-2xl border-2 ${
                        alert.type === 'danger' ? 'bg-rose-50 border-rose-200' :
                        alert.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                        'bg-emerald-50 border-emerald-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          alert.type === 'danger' ? 'bg-rose-100 text-rose-600' :
                          alert.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                          'bg-emerald-100 text-emerald-600'
                        }`}>
                          {alert.icon}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm text-slate-800">{alert.title}</p>
                          <p className="text-xs text-slate-600 mt-1">{alert.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Projeções Futuras com Renda Variável */}
            <section className="bg-white p-5 rounded-3xl border shadow-sm">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500"/> Projeção Financeira (Renda Variável)
              </h3>
              
              {/* Card do Saldo Atual */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-2xl mb-4 border-2 border-indigo-100">
                <p className="text-xs text-indigo-600 font-bold uppercase mb-1">Saldo Atual</p>
                <p className="text-3xl font-bold text-indigo-700">R$ {totals.balance.toFixed(2)}</p>
                <p className="text-xs text-slate-600 mt-2">
                  Renda média: <strong>R$ {predictability.avgIncome.toFixed(2)}</strong> • 
                  Gastos médios: <strong>R$ {predictability.avgExpenses.toFixed(2)}</strong>
                </p>
              </div>

              {/* Cenários de Renda */}
              <div className="mb-4 p-3 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-600 mb-2">Cenários de Renda (baseado nos últimos 3 meses)</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-xs text-rose-600 font-medium">🔴 Conservador</p>
                    <p className="text-sm font-bold text-slate-700">R$ {predictability.incomeScenarios.conservative.toFixed(0)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-indigo-600 font-medium">🔵 Realista</p>
                    <p className="text-sm font-bold text-slate-700">R$ {predictability.incomeScenarios.realistic.toFixed(0)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-emerald-600 font-medium">🟢 Otimista</p>
                    <p className="text-sm font-bold text-slate-700">R$ {predictability.incomeScenarios.optimistic.toFixed(0)}</p>
                  </div>
                </div>
              </div>

              {/* Projeção 3 Meses */}
              <div className="mb-3">
                <p className="text-sm font-bold text-slate-700 mb-2">📅 Em 3 meses</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className={`p-3 rounded-xl text-center border-2 ${
                    predictability.projections.conservative.in3Months >= 0 
                      ? 'bg-rose-50 border-rose-200' 
                      : 'bg-rose-100 border-rose-300'
                  }`}>
                    <p className="text-xs text-rose-700 font-medium mb-1">Conservador</p>
                    <p className={`text-sm font-bold ${
                      predictability.projections.conservative.in3Months >= 0 ? 'text-rose-700' : 'text-rose-600'
                    }`}>
                      R$ {predictability.projections.conservative.in3Months.toFixed(0)}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl text-center border-2 ${
                    predictability.projections.realistic.in3Months >= 0 
                      ? 'bg-indigo-50 border-indigo-200' 
                      : 'bg-rose-100 border-rose-300'
                  }`}>
                    <p className="text-xs text-indigo-700 font-medium mb-1">Realista</p>
                    <p className={`text-sm font-bold ${
                      predictability.projections.realistic.in3Months >= 0 ? 'text-indigo-700' : 'text-rose-600'
                    }`}>
                      R$ {predictability.projections.realistic.in3Months.toFixed(0)}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl text-center border-2 ${
                    predictability.projections.optimistic.in3Months >= 0 
                      ? 'bg-emerald-50 border-emerald-200' 
                      : 'bg-rose-100 border-rose-300'
                  }`}>
                    <p className="text-xs text-emerald-700 font-medium mb-1">Otimista</p>
                    <p className={`text-sm font-bold ${
                      predictability.projections.optimistic.in3Months >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}>
                      R$ {predictability.projections.optimistic.in3Months.toFixed(0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Projeção 6 Meses */}
              <div className="mb-3">
                <p className="text-sm font-bold text-slate-700 mb-2">📅 Em 6 meses</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className={`p-3 rounded-xl text-center border-2 ${
                    predictability.projections.conservative.in6Months >= 0 
                      ? 'bg-rose-50 border-rose-200' 
                      : 'bg-rose-100 border-rose-300'
                  }`}>
                    <p className="text-xs text-rose-700 font-medium mb-1">Conservador</p>
                    <p className={`text-sm font-bold ${
                      predictability.projections.conservative.in6Months >= 0 ? 'text-rose-700' : 'text-rose-600'
                    }`}>
                      R$ {predictability.projections.conservative.in6Months.toFixed(0)}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl text-center border-2 ${
                    predictability.projections.realistic.in6Months >= 0 
                      ? 'bg-indigo-50 border-indigo-200' 
                      : 'bg-rose-100 border-rose-300'
                  }`}>
                    <p className="text-xs text-indigo-700 font-medium mb-1">Realista</p>
                    <p className={`text-sm font-bold ${
                      predictability.projections.realistic.in6Months >= 0 ? 'text-indigo-700' : 'text-rose-600'
                    }`}>
                      R$ {predictability.projections.realistic.in6Months.toFixed(0)}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl text-center border-2 ${
                    predictability.projections.optimistic.in6Months >= 0 
                      ? 'bg-emerald-50 border-emerald-200' 
                      : 'bg-rose-100 border-rose-300'
                  }`}>
                    <p className="text-xs text-emerald-700 font-medium mb-1">Otimista</p>
                    <p className={`text-sm font-bold ${
                      predictability.projections.optimistic.in6Months >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}>
                      R$ {predictability.projections.optimistic.in6Months.toFixed(0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Projeção 12 Meses */}
              <div>
                <p className="text-sm font-bold text-slate-700 mb-2">📅 Em 12 meses (1 ano)</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className={`p-3 rounded-xl text-center border-2 ${
                    predictability.projections.conservative.in12Months >= 0 
                      ? 'bg-rose-50 border-rose-200' 
                      : 'bg-rose-100 border-rose-300'
                  }`}>
                    <p className="text-xs text-rose-700 font-medium mb-1">Conservador</p>
                    <p className={`text-sm font-bold ${
                      predictability.projections.conservative.in12Months >= 0 ? 'text-rose-700' : 'text-rose-600'
                    }`}>
                      R$ {predictability.projections.conservative.in12Months.toFixed(0)}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl text-center border-2 ${
                    predictability.projections.realistic.in12Months >= 0 
                      ? 'bg-indigo-50 border-indigo-200' 
                      : 'bg-rose-100 border-rose-300'
                  }`}>
                    <p className="text-xs text-indigo-700 font-medium mb-1">Realista</p>
                    <p className={`text-sm font-bold ${
                      predictability.projections.realistic.in12Months >= 0 ? 'text-indigo-700' : 'text-rose-600'
                    }`}>
                      R$ {predictability.projections.realistic.in12Months.toFixed(0)}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl text-center border-2 ${
                    predictability.projections.optimistic.in12Months >= 0 
                      ? 'bg-emerald-50 border-emerald-200' 
                      : 'bg-rose-100 border-rose-300'
                  }`}>
                    <p className="text-xs text-emerald-700 font-medium mb-1">Otimista</p>
                    <p className={`text-sm font-bold ${
                      predictability.projections.optimistic.in12Months >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}>
                      R$ {predictability.projections.optimistic.in12Months.toFixed(0)}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Médias dos Últimos 3 Meses */}
            <section className="bg-white p-5 rounded-3xl border shadow-sm">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-500"/> Seu Comportamento (3 meses)
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl">
                  <span className="text-sm text-slate-700 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600"/> Receitas médias
                  </span>
                  <span className="font-bold text-emerald-600">R$ {predictability.avgIncome.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-rose-50 rounded-xl">
                  <span className="text-sm text-slate-700 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-rose-600"/> Gastos médios
                  </span>
                  <span className="font-bold text-rose-600">R$ {predictability.avgExpenses.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-xl">
                  <span className="text-sm text-slate-700 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-indigo-600"/> Saldo médio
                  </span>
                  <span className={`font-bold ${
                    predictability.avgBalance >= 0 ? 'text-indigo-600' : 'text-rose-600'
                  }`}>
                    R$ {predictability.avgBalance.toFixed(2)}
                  </span>
                </div>
              </div>
            </section>

            {/* Comparação por Categoria */}
            <section className="bg-white p-5 rounded-3xl border shadow-sm">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-indigo-500"/> Comparação por Categoria
              </h3>
              <div className="space-y-2">
                {Object.entries(predictability.categoryComparison)
                  .filter(([, data]) => data.current > 0 || data.last > 0)
                  .sort((a, b) => b[1].current - a[1].current)
                  .map(([cat, data]) => (
                    <div key={cat} className="p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {CATEGORIES[cat]?.icon}
                          <span className="text-sm font-semibold text-slate-700">{cat}</span>
                        </div>
                        {data.aboveAverage && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold">
                            Acima da média
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-500">Atual: </span>
                          <span className="font-bold text-slate-700">R$ {data.current.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Anterior: </span>
                          <span className="font-bold text-slate-700">R$ {data.last.toFixed(2)}</span>
                        </div>
                      </div>
                      {data.diff !== 0 && data.last > 0 && (
                        <div className="mt-2 flex items-center gap-1">
                          {data.diff > 0 ? (
                            <TrendingUp className="w-3 h-3 text-rose-500" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-emerald-500" />
                          )}
                          <span className={`text-xs font-bold ${
                            data.diff > 0 ? 'text-rose-500' : 'text-emerald-500'
                          }`}>
                            {data.diff > 0 ? '+' : ''}{data.diff.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </section>

            {/* Mensagem Final - Interpretação dos Cenários */}
            <section className="bg-gradient-to-br from-slate-50 to-indigo-50 p-5 rounded-3xl border-2 border-dashed border-indigo-200">
              <div className="text-center">
                <Calculator className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
                <p className="text-lg font-bold text-slate-800 mb-2">
                  {predictability.avgIncome > predictability.avgExpenses 
                    ? '📈 Situação Positiva!' 
                    : '⚠️ Atenção Necessária'
                  }
                </p>
                <p className="text-sm text-slate-700 mb-3">
                  {predictability.avgIncome > predictability.avgExpenses 
                    ? `No cenário realista, você acumula R$ ${(predictability.projections.realistic.in12Months - totals.balance).toFixed(2)} em 12 meses.`
                    : `Seus gastos excedem sua renda. Ajuste necessário: R$ ${(predictability.avgExpenses - predictability.avgIncome).toFixed(2)}/mês`
                  }
                </p>
                
                {/* Range de possibilidades */}
                <div className="bg-white p-3 rounded-xl">
                  <p className="text-xs text-slate-600 mb-2 font-medium">Sua faixa de possibilidades em 1 ano:</p>
                  <div className="flex items-center justify-between">
                    <div className="text-center flex-1">
                      <p className="text-xs text-rose-600 font-medium">Pior caso</p>
                      <p className="text-sm font-bold text-rose-700">
                        R$ {predictability.projections.conservative.in12Months.toFixed(0)}
                      </p>
                    </div>
                    <div className="w-px h-8 bg-slate-300"></div>
                    <div className="text-center flex-1">
                      <p className="text-xs text-emerald-600 font-medium">Melhor caso</p>
                      <p className="text-sm font-bold text-emerald-700">
                        R$ {predictability.projections.optimistic.in12Months.toFixed(0)}
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">
                    Diferença: R$ {(predictability.projections.optimistic.in12Months - predictability.projections.conservative.in12Months).toFixed(0)}
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* === CARTÃO DE CRÉDITO === */}
        {activeTab === 'creditcard' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Header */}
            <section className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <Briefcase className="w-6 h-6"/> Cartão de Crédito
                </h2>
                <p className="text-blue-100 text-sm">Controle completo das suas faturas e parcelas</p>
              </div>
              <Sparkles className="absolute -top-4 -right-4 w-32 h-32 text-white/5" />
            </section>

            {/* Meus Cartões */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-blue-500"/> Meus Cartões
                </h3>
                <button onClick={() => setShowCardModal(true)} className="text-blue-600 text-xs font-bold bg-blue-50 px-3 py-1 rounded-full">+ Novo Cartão</button>
              </div>

              {creditCards.length === 0 ? (
                <div className="text-center py-8 bg-blue-50 rounded-2xl border-2 border-dashed border-blue-200">
                  <Wallet className="w-8 h-8 text-blue-300 mx-auto mb-2"/>
                  <p className="text-sm text-blue-700 font-medium">Nenhum cartão cadastrado</p>
                  <p className="text-xs text-blue-600 mt-1">Adicione seu primeiro cartão</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {creditCards.map(card => {
                    const now = new Date();
                    const currentBills = creditCardBills.filter(b => 
                      b.cardId === card.firestoreId && 
                      b.month === now.getMonth() && 
                      b.year === now.getFullYear()
                    );
                    const currentBill = currentBills[0];
                    const usage = currentBill ? (currentBill.total / card.limit) * 100 : 0;
                    const available = card.limit - (currentBill?.total || 0);

                    return (
                      <div key={card.firestoreId} className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-4 text-white shadow-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-bold text-lg">{card.name}</p>
                            <p className="text-xs text-blue-100">{card.brand || 'Cartão de Crédito'}</p>
                          </div>
                          <button onClick={() => handleDeleteCard(card.firestoreId)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="mb-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Limite usado</span>
                            <span className="font-bold">{usage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-white/20 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${usage > 80 ? 'bg-rose-400' : 'bg-white'}`}
                              style={{width: `${Math.min(usage, 100)}%`}}
                            ></div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div className="bg-white/10 p-2 rounded-lg">
                            <p className="text-blue-100">Fatura Atual</p>
                            <p className="font-bold text-sm">R$ {(currentBill?.total || 0).toFixed(2)}</p>
                          </div>
                          <div className="bg-white/10 p-2 rounded-lg">
                            <p className="text-blue-100">Disponível</p>
                            <p className="font-bold text-sm">R$ {available.toFixed(2)}</p>
                          </div>
                        </div>

                        {currentBill && currentBill.total > 0 && (
                          <button 
                            onClick={() => handlePayBill(card, currentBill.total, currentBill.month, currentBill.year)}
                            className="w-full bg-white/20 hover:bg-white/30 active:scale-95 text-white font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-2 mb-2"
                          >
                            <DollarSign className="w-4 h-4"/> Pagar Fatura
                          </button>
                        )}

                        <div className="text-[10px] text-blue-100">
                          Fecha dia {card.closingDay} • Vence dia {card.dueDay}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Nova Compra */}
            {creditCards.length > 0 && (
              <section className="bg-white p-5 rounded-3xl border shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <Plus className="w-4 h-4 text-blue-500"/> Nova Compra
                  </h3>
                  <button onClick={() => setShowCardPurchaseModal(true)} className="text-blue-600 text-xs font-bold bg-blue-50 px-3 py-1 rounded-full">+ Registrar</button>
                </div>
                <p className="text-xs text-slate-500">Registre compras parceladas para controlar suas faturas futuras</p>
              </section>
            )}

            {/* Próximas Faturas */}
            {creditCards.length > 0 && (
              <section className="bg-white p-5 rounded-3xl border shadow-sm">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500"/> Próximas Faturas
                </h3>
                <div className="space-y-3">
                  {creditCards.map(card => {
                    const now = new Date();
                    const nextMonths = [0, 1, 2, 3].map(i => {
                      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
                      return {
                        month: date.getMonth(),
                        year: date.getFullYear(),
                        label: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
                      };
                    });

                    return (
                      <div key={card.firestoreId} className="border-l-4 border-blue-500 pl-3">
                        <p className="text-sm font-bold text-slate-800 mb-2">{card.name}</p>
                        <div className="grid grid-cols-4 gap-2">
                          {nextMonths.map(({month, year, label}) => {
                            const bill = creditCardBills.find(b => 
                              b.cardId === card.firestoreId && 
                              b.month === month && 
                              b.year === year
                            );
                            const total = bill?.total || 0;
                            const isOverLimit = total > card.limit * 0.8;

                            return (
                              <div key={`${month}-${year}`} className={`p-2 rounded-xl text-center ${isOverLimit ? 'bg-rose-50' : 'bg-slate-50'}`}>
                                <p className="text-[10px] text-slate-500 uppercase">{label}</p>
                                <p className={`text-sm font-bold ${isOverLimit ? 'text-rose-600' : 'text-slate-700'}`}>
                                  R$ {total.toFixed(0)}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Compras Ativas */}
            {cardPurchases.length > 0 && (
              <section className="bg-white p-5 rounded-3xl border shadow-sm">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-blue-500"/> Compras Parceladas
                </h3>
                <div className="space-y-2">
                  {cardPurchases.map(purchase => {
                    const card = creditCards.find(c => c.firestoreId === purchase.cardId);
                    const installmentValue = purchase.amount / purchase.installments;
                    
                    return (
                      <div key={purchase.firestoreId} className="p-3 bg-slate-50 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-bold text-sm text-slate-800">{purchase.description}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {card?.name} • {purchase.installments}x de R$ {installmentValue.toFixed(2)}
                            </p>
                          </div>
                          <button 
                            onClick={() => handleDeleteCardPurchase(purchase.firestoreId)}
                            className="p-2 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3 h-3 text-slate-400 hover:text-rose-500" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-600">
                            Total: <strong>R$ {purchase.amount.toFixed(2)}</strong>
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                            {purchase.installments}x
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Alertas de Cartão */}
            {(() => {
              const alerts = [];
              const now = new Date();
              
              creditCards.forEach(card => {
                const currentBill = creditCardBills.find(b => 
                  b.cardId === card.firestoreId && 
                  b.month === now.getMonth() && 
                  b.year === now.getFullYear()
                );
                const usage = currentBill ? (currentBill.total / card.limit) * 100 : 0;

                // Alerta de limite
                if (usage > 80) {
                  alerts.push({
                    type: 'danger',
                    title: `${card.name}: Limite alto!`,
                    message: `Você usou ${usage.toFixed(1)}% do limite (R$ ${currentBill.total.toFixed(2)} de R$ ${card.limit.toFixed(2)})`
                  });
                }

                // Alerta de comprometimento futuro
                const nextBill = creditCardBills.find(b => 
                  b.cardId === card.firestoreId && 
                  b.month === (now.getMonth() + 1) % 12 && 
                  b.year === (now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear())
                );
                if (nextBill && nextBill.total > card.limit * 0.6) {
                  alerts.push({
                    type: 'warning',
                    title: `${card.name}: Próxima fatura alta`,
                    message: `Você já comprometeu R$ ${nextBill.total.toFixed(2)} da próxima fatura (${((nextBill.total / card.limit) * 100).toFixed(1)}% do limite)`
                  });
                }

                // Alerta de vencimento próximo
                const daysUntilDue = card.dueDay - now.getDate();
                if (daysUntilDue > 0 && daysUntilDue <= 3 && currentBill && currentBill.total > 0) {
                  alerts.push({
                    type: 'info',
                    title: `${card.name}: Fatura vencendo`,
                    message: `Sua fatura de R$ ${currentBill.total.toFixed(2)} vence em ${daysUntilDue} dia${daysUntilDue > 1 ? 's' : ''}`
                  });
                }
              });

              return alerts.length > 0 && (
                <section>
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-amber-500"/> Alertas
                  </h3>
                  <div className="space-y-2">
                    {alerts.map((alert, idx) => (
                      <div 
                        key={idx}
                        className={`p-4 rounded-2xl border-2 ${
                          alert.type === 'danger' ? 'bg-rose-50 border-rose-200' :
                          alert.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                          'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <p className="font-bold text-sm text-slate-800">{alert.title}</p>
                        <p className="text-xs text-slate-600 mt-1">{alert.message}</p>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })()}
          </div>
        )}

        {/* === INVESTIMENTOS === */}
        {activeTab === 'investments' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Header */}
            <section className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6"/> Meus Investimentos
                </h2>
                <p className="text-emerald-100 text-sm">Acompanhe seu patrimônio investido</p>
                
                {/* Total investido */}
                <div className="mt-4">
                  <p className="text-3xl font-bold">R$ {investmentTotals.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  {investmentTotals.profit !== 0 && (
                    <p className={`text-sm mt-1 ${investmentTotals.profit >= 0 ? 'text-emerald-200' : 'text-rose-200'}`}>
                      {investmentTotals.profit >= 0 ? '↑' : '↓'} R$ {Math.abs(investmentTotals.profit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                      ({investmentTotals.profitPercentage >= 0 ? '+' : ''}{investmentTotals.profitPercentage.toFixed(2)}%)
                    </p>
                  )}
                </div>
              </div>
              <Sparkles className="absolute -top-4 -right-4 w-32 h-32 text-white/5" />
            </section>

            {/* Botão Adicionar */}
            <button 
              onClick={() => setShowInvestmentModal(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5"/> Adicionar Investimento
            </button>

            {/* Distribuição por Tipo */}
            {investmentTotals.byType.length > 0 && (
              <section className="bg-white p-5 rounded-3xl border shadow-sm">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-emerald-500"/> Distribuição por Tipo
                </h3>
                <div className="space-y-3">
                  {investmentTotals.byType.map(([type, value]) => {
                    const percentage = (value / investmentTotals.total) * 100;
                    return (
                      <div key={type}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-semibold text-slate-700">{type}</span>
                          <span className="text-xs text-slate-600">
                            R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                            style={{width: `${percentage}%`}}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Lista de Investimentos */}
            <section>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-500"/> Carteira
              </h3>

              {investments.length === 0 ? (
                <div className="text-center py-8 bg-emerald-50 rounded-2xl border-2 border-dashed border-emerald-200">
                  <TrendingUp className="w-8 h-8 text-emerald-300 mx-auto mb-2"/>
                  <p className="text-sm text-emerald-700 font-medium">Nenhum investimento cadastrado</p>
                  <p className="text-xs text-emerald-600 mt-1">Adicione seus investimentos para acompanhar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {investments.map(inv => {
                    // Calcular valor projetado se autoCalculate estiver ativo
                    const projectedValue = inv.autoCalculate ? calculateProjectedValue(inv) : inv.currentValue;
                    const displayValue = inv.autoCalculate ? projectedValue : inv.currentValue;
                    const profit = displayValue - inv.initialValue;
                    const profitPercentage = inv.initialValue > 0 ? (profit / inv.initialValue) * 100 : 0;
                    
                    // Calcular dias desde o investimento
                    const daysSinceStart = Math.floor((new Date() - new Date(inv.date)) / (1000 * 60 * 60 * 24));
                    
                    // Formatar taxa para exibição
                    const getRateLabel = () => {
                      if (!inv.annualRate && inv.rateType !== 'poupanca') return null;
                      if (inv.rateType === 'cdi') return `${inv.annualRate}% CDI`;
                      if (inv.rateType === 'selic') return `${inv.annualRate}% Selic`;
                      if (inv.rateType === 'ipca') return `IPCA + ${inv.annualRate}%`;
                      if (inv.rateType === 'poupanca') return 'Poupança';
                      return `${inv.annualRate}% a.a.`;
                    };
                    
                    return (
                      <div key={inv.firestoreId} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-800">{inv.name}</p>
                              {inv.autoCalculate && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">
                                  Auto
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              {inv.type} • {daysSinceStart} dias
                              {getRateLabel() && <span className="text-emerald-600"> • {getRateLabel()}</span>}
                            </p>
                            {inv.notes && (
                              <p className="text-xs text-slate-400 mt-1">{inv.notes}</p>
                            )}
                          </div>
                          <button 
                            onClick={() => handleDeleteInvestment(inv.firestoreId)}
                            className="p-2 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-slate-400 hover:text-rose-500"/>
                          </button>
                        </div>

                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <p className="text-2xl font-bold text-slate-800">
                              R$ {displayValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className={`text-xs font-medium ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {profit >= 0 ? '+' : ''}R$ {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                              ({profitPercentage >= 0 ? '+' : ''}{profitPercentage.toFixed(2)}%)
                            </p>
                            {inv.autoCalculate && inv.currentValue !== displayValue && (
                              <p className="text-[10px] text-slate-400 mt-1">
                                Registrado: R$ {inv.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-400">Valor inicial</p>
                            <p className="text-sm text-slate-600 font-medium">
                              R$ {inv.initialValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <button 
                            onClick={() => {
                              const value = prompt('Novo valor atual do investimento:');
                              if (value && !isNaN(value)) handleUpdateInvestmentValue(inv.firestoreId, value);
                            }}
                            className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold py-2 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3"/> Atualizar
                          </button>
                          <button 
                            onClick={() => {
                              const value = prompt('Valor do aporte:');
                              if (value && !isNaN(value)) handleAddToInvestment(inv.firestoreId, value);
                            }}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold py-2 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1"
                          >
                            <Plus className="w-3 h-3"/> Aportar
                          </button>
                          <button 
                            onClick={() => {
                              const value = prompt('Valor do resgate:');
                              if (value && !isNaN(value)) handleWithdrawFromInvestment(inv.firestoreId, value);
                            }}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold py-2 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1"
                          >
                            <DollarSign className="w-3 h-3"/> Resgatar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Explicação */}
            <section className="bg-gradient-to-br from-slate-50 to-emerald-50 p-5 rounded-3xl border-2 border-dashed border-emerald-200">
              <div className="text-center">
                <Calculator className="w-8 h-8 text-emerald-400 mx-auto mb-3"/>
                <p className="text-sm font-bold text-slate-700 mb-2">💡 Como funciona?</p>
                <div className="text-xs text-slate-600 space-y-2 text-left">
                  <p>• <strong>Investimento existente:</strong> Valor que você já possui (não desconta do saldo)</p>
                  <p>• <strong>Novo aporte:</strong> Quando você investe dinheiro novo (desconta do saldo)</p>
                  <p>• <strong>Cálculo automático:</strong> O sistema calcula o rendimento diário com juros compostos</p>
                  <p>• <strong>Tipos de taxa:</strong> Taxa fixa, % do CDI, % da Selic, IPCA+ ou Poupança</p>
                  <p>• <strong>Atualizar:</strong> Corrija o valor manualmente se necessário</p>
                  <p>• <strong>Resgatar:</strong> Quando você retira dinheiro do investimento (volta para o saldo)</p>
                </div>
                <div className="mt-3 pt-3 border-t border-emerald-200">
                  <p className="text-[10px] text-slate-500">
                    📊 Taxas de referência: CDI ~13,15% | Selic ~13,25% | IPCA ~4,5% | Poupança ~7,5%
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* NAV BAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 safe-bottom">
        <div className="flex justify-around items-stretch h-16">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all relative ${
              activeTab === 'dashboard' 
                ? 'text-indigo-600' 
                : 'text-slate-400 active:bg-slate-50'
            }`}
          >
            {activeTab === 'dashboard' && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-indigo-600 rounded-b-full"></div>
            )}
            <Home className={`w-5 h-5 transition-transform ${activeTab === 'dashboard' ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-medium">Início</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('insights')} 
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all relative ${
              activeTab === 'insights' 
                ? 'text-indigo-600' 
                : 'text-slate-400 active:bg-slate-50'
            }`}
          >
            {activeTab === 'insights' && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-indigo-600 rounded-b-full"></div>
            )}
            <PieChartIcon className={`w-5 h-5 transition-transform ${activeTab === 'insights' ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-medium">Insights</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('future')} 
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all relative ${
              activeTab === 'future' 
                ? 'text-indigo-600' 
                : 'text-slate-400 active:bg-slate-50'
            }`}
          >
            {activeTab === 'future' && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-indigo-600 rounded-b-full"></div>
            )}
            <Map className={`w-5 h-5 transition-transform ${activeTab === 'future' ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-medium">Futuro</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('predictability')} 
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all relative ${
              activeTab === 'predictability' 
                ? 'text-indigo-600' 
                : 'text-slate-400 active:bg-slate-50'
            }`}
          >
            {activeTab === 'predictability' && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-indigo-600 rounded-b-full"></div>
            )}
            <BarChart3 className={`w-5 h-5 transition-transform ${activeTab === 'predictability' ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-medium">Previsão</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('investments')} 
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all relative ${
              activeTab === 'investments' 
                ? 'text-indigo-600' 
                : 'text-slate-400 active:bg-slate-50'
            }`}
          >
            {activeTab === 'investments' && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-indigo-600 rounded-b-full"></div>
            )}
            <TrendingUp className={`w-5 h-5 transition-transform ${activeTab === 'investments' ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-medium">Investir</span>
          </button>
        </div>
      </nav>

      {/* MODALS */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-bold text-lg mb-4">Adicionar Transação</h3>
            
            {/* Seletor Entrada/Saída */}
            <div className="flex gap-2 mb-4">
              <button 
                onClick={()=>setNewTx({...newTx, type: 'income', category: 'Renda'})}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${newTx.type === 'income' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}
              >
                <TrendingUp className="w-4 h-4"/> Entrada
              </button>
              <button 
                onClick={()=>setNewTx({...newTx, type: 'expense', category: 'Alimentação'})}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${newTx.type === 'expense' ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}
              >
                <TrendingDown className="w-4 h-4"/> Saída
              </button>
            </div>

            <input autoFocus placeholder={newTx.type === 'income' ? 'Ex: Salário, Freelance' : 'Ex: Mercado, Uber'} className="w-full bg-slate-50 p-3 rounded-xl mb-3" value={newTx.description} onChange={e=>setNewTx({...newTx, description: e.target.value})}/>
            
            <div className="flex gap-3 mb-3">
              <input type="number" placeholder="Valor" className="flex-1 bg-slate-50 p-3 rounded-xl" value={newTx.amount} onChange={e=>setNewTx({...newTx, amount: e.target.value})}/>
              <input type="date" className="w-32 bg-slate-50 p-3 rounded-xl" value={newTx.date} onChange={e=>setNewTx({...newTx, date: e.target.value})}/>
            </div>

            {/* Seletor de Categoria (só para despesas) */}
            {newTx.type === 'expense' && (
              <div className="mb-3">
                <label className="text-xs font-bold text-slate-500 ml-1 uppercase mb-1 block">Categoria</label>
                <select 
                  className="w-full bg-slate-50 p-3 rounded-xl border-none"
                  value={newTx.category}
                  onChange={e=>setNewTx({...newTx, category: e.target.value})}
                >
                  {Object.keys(CATEGORIES).filter(c => c !== 'Renda').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Parcelamento */}
            {newTx.type === 'expense' && (
              <div className="mb-3">
                <label className="text-xs font-bold text-slate-500 ml-1 uppercase mb-1 block">Parcelamento</label>
                <input 
                  type="number" 
                  min="1" 
                  max="48"
                  placeholder="Nº de parcelas (1 = à vista)"
                  className="w-full bg-slate-50 p-3 rounded-xl"
                  value={newTx.installments}
                  onChange={e=>setNewTx({...newTx, installments: parseInt(e.target.value) || 1})}
                />
                {newTx.installments > 1 && (
                  <p className="text-xs text-indigo-600 mt-1">
                    {newTx.installments}x de R$ {(parseFloat(newTx.amount || 0) / newTx.installments).toFixed(2)}
                  </p>
                )}
              </div>
            )}

            {/* Tags */}
            <div className="mb-3">
              <label className="text-xs font-bold text-slate-500 ml-1 uppercase mb-1 block">Tags (opcional)</label>
              <input 
                placeholder="Ex: urgente, trabalho (separar por vírgula)"
                className="w-full bg-slate-50 p-3 rounded-xl text-sm"
                value={(newTx.tags || []).join(', ')}
                onChange={e=>setNewTx({...newTx, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)})}
              />
            </div>
            
            <div onClick={()=>setNewTx({...newTx, recurring: !newTx.recurring})} className={`p-3 rounded-xl border mb-4 flex items-center gap-2 cursor-pointer ${newTx.recurring ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100'}`}>
               <RefreshCw className="w-4 h-4"/> <span className="text-sm">É recorrente? (Fixo todo mês)</span>
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
            <input type="date" className="w-full bg-slate-50 p-3 rounded-xl mb-3" value={newGoal.deadline} onChange={e=>setNewGoal({...newGoal, deadline: e.target.value})}/>
            <label className="text-xs text-slate-500 ml-1">💰 Quanto guardar por mês? (Opcional)</label>
            <input type="number" placeholder="Ex: 400" className="w-full bg-slate-50 p-3 rounded-xl mb-4" value={newGoal.monthlyContribution} onChange={e=>setNewGoal({...newGoal, monthlyContribution: e.target.value})}/>
            <div className="flex gap-2">
              <button onClick={()=>setShowGoalModal(false)} className="flex-1 p-3 text-slate-500">Cancelar</button>
              <button onClick={handleAddGoal} className="flex-1 p-3 bg-indigo-600 text-white rounded-xl font-bold">Criar Meta</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingTx && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-bold text-lg mb-4">Editar Transação</h3>
            <input placeholder="Descrição" className="w-full bg-slate-50 p-3 rounded-xl mb-3" value={editingTx.description} onChange={e=>setEditingTx({...editingTx, description: e.target.value})}/>
            <div className="flex gap-3 mb-3">
              <input type="number" placeholder="Valor" className="flex-1 bg-slate-50 p-3 rounded-xl" value={editingTx.amount} onChange={e=>setEditingTx({...editingTx, amount: e.target.value})}/>
              <input type="date" className="w-32 bg-slate-50 p-3 rounded-xl" value={editingTx.date} onChange={e=>setEditingTx({...editingTx, date: e.target.value})}/>
            </div>
            <select className="w-full bg-slate-50 p-3 rounded-xl mb-3" value={editingTx.category} onChange={e=>setEditingTx({...editingTx, category: e.target.value})}>
              {Object.keys(CATEGORIES).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input 
              placeholder="Tags (separar por vírgula)"
              className="w-full bg-slate-50 p-3 rounded-xl mb-3 text-sm"
              value={(editingTx.tags || []).join(', ')}
              onChange={e=>setEditingTx({...editingTx, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)})}
            />
            <div className="flex gap-2">
              <button onClick={()=>{setShowEditModal(false); setEditingTx(null);}} className="flex-1 p-3 text-slate-500">Cancelar</button>
              <button onClick={handleEditTransaction} className="flex-1 p-3 bg-indigo-600 text-white rounded-xl font-bold">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-bold text-lg mb-4">Novo Orçamento Mensal</h3>
            <label className="text-xs font-bold text-slate-500 ml-1 uppercase mb-1 block">Categoria</label>
            <select className="w-full bg-slate-50 p-3 rounded-xl mb-3" value={newBudget.category} onChange={e=>setNewBudget({...newBudget, category: e.target.value})}>
              {Object.keys(CATEGORIES).filter(c => c !== 'Renda').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input type="number" placeholder="Limite mensal (R$)" className="w-full bg-slate-50 p-3 rounded-xl mb-4" value={newBudget.limit} onChange={e=>setNewBudget({...newBudget, limit: e.target.value})}/>
            <div className="flex gap-2">
              <button onClick={()=>setShowBudgetModal(false)} className="flex-1 p-3 text-slate-500">Cancelar</button>
              <button onClick={handleAddBudget} className="flex-1 p-3 bg-indigo-600 text-white rounded-xl font-bold">Criar</button>
            </div>
          </div>
        </div>
      )}

      {showReminderModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-bold text-lg mb-4">Novo Lembrete de Conta</h3>
            <input placeholder="Nome da conta (ex: Aluguel)" className="w-full bg-slate-50 p-3 rounded-xl mb-3" value={newReminder.name} onChange={e=>setNewReminder({...newReminder, name: e.target.value})}/>
            
            <input type="number" placeholder="Valor (R$)" className="w-full bg-slate-50 p-3 rounded-xl mb-3" value={newReminder.amount} onChange={e=>setNewReminder({...newReminder, amount: e.target.value})}/>
            
            <label className="text-xs font-bold text-slate-500 ml-1 uppercase mb-1 block">Data de Vencimento</label>
            <div className="flex gap-2 mb-3">
              <input 
                type="number" 
                placeholder="Dia" 
                min="1" 
                max="31" 
                className="w-20 bg-slate-50 p-3 rounded-xl" 
                value={newReminder.dueDay} 
                onChange={e=>setNewReminder({...newReminder, dueDay: e.target.value})}
              />
              <select 
                className="flex-1 bg-slate-50 p-3 rounded-xl"
                value={newReminder.dueMonth}
                onChange={e=>setNewReminder({...newReminder, dueMonth: parseInt(e.target.value)})}
              >
                {Array.from({length: 12}, (_, i) => {
                  const date = new Date(2025, i, 1);
                  return (
                    <option key={i} value={i}>
                      {date.toLocaleDateString('pt-BR', { month: 'long' })}
                    </option>
                  );
                })}
              </select>
              <input 
                type="number" 
                placeholder="Ano"
                min={new Date().getFullYear()}
                max={new Date().getFullYear() + 5}
                className="w-24 bg-slate-50 p-3 rounded-xl"
                value={newReminder.dueYear}
                onChange={e=>setNewReminder({...newReminder, dueYear: parseInt(e.target.value)})}
              />
            </div>
            
            <select className="w-full bg-slate-50 p-3 rounded-xl mb-3" value={newReminder.category} onChange={e=>setNewReminder({...newReminder, category: e.target.value})}>
              {Object.keys(CATEGORIES).filter(c => c !== 'Renda').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            
            <label className="flex items-center gap-2 mb-4 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
              <input 
                type="checkbox" 
                checked={newReminder.recurring}
                onChange={e=>setNewReminder({...newReminder, recurring: e.target.checked})}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-sm text-slate-700">
                <strong>Conta recorrente</strong> <span className="text-slate-500">(se repete todo mês)</span>
              </span>
            </label>
            
            <div className="flex gap-2">
              <button onClick={()=>setShowReminderModal(false)} className="flex-1 p-3 text-slate-500">Cancelar</button>
              <button onClick={handleAddReminder} className="flex-1 p-3 bg-indigo-600 text-white rounded-xl font-bold">Criar</button>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-bold text-lg mb-4">Importar Extrato</h3>
            <p className="text-sm text-slate-600 mb-4">
              Envie um arquivo CSV no formato:<br/>
              <code className="text-xs bg-slate-100 p-1 rounded">data, descrição, valor</code>
            </p>
            <input 
              type="file" 
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="w-full bg-slate-50 p-3 rounded-xl mb-4 text-sm"
            />
            <button onClick={()=>setShowUploadModal(false)} className="w-full p-3 text-slate-500">Cancelar</button>
          </div>
        </div>
      )}

      {/* Modal Novo Cartão */}
      {showCardModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-bold text-lg mb-4">Novo Cartão de Crédito</h3>
            
            <input 
              placeholder="Nome do cartão (ex: Nubank)" 
              className="w-full bg-slate-50 p-3 rounded-xl mb-3" 
              value={newCard.name} 
              onChange={e=>setNewCard({...newCard, name: e.target.value})}
            />
            
            <input 
              type="number" 
              placeholder="Limite total (R$)" 
              className="w-full bg-slate-50 p-3 rounded-xl mb-3" 
              value={newCard.limit} 
              onChange={e=>setNewCard({...newCard, limit: e.target.value})}
            />
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input 
                type="number" 
                placeholder="Dia de fechamento" 
                min="1" 
                max="31" 
                className="w-full bg-slate-50 p-3 rounded-xl" 
                value={newCard.closingDay} 
                onChange={e=>setNewCard({...newCard, closingDay: e.target.value})}
              />
              <input 
                type="number" 
                placeholder="Dia de vencimento" 
                min="1" 
                max="31" 
                className="w-full bg-slate-50 p-3 rounded-xl" 
                value={newCard.dueDay} 
                onChange={e=>setNewCard({...newCard, dueDay: e.target.value})}
              />
            </div>
            
            <input 
              placeholder="Bandeira (opcional)" 
              className="w-full bg-slate-50 p-3 rounded-xl mb-4" 
              value={newCard.brand} 
              onChange={e=>setNewCard({...newCard, brand: e.target.value})}
            />
            
            <div className="flex gap-2">
              <button onClick={()=>setShowCardModal(false)} className="flex-1 p-3 text-slate-500">Cancelar</button>
              <button onClick={handleAddCard} className="flex-1 p-3 bg-blue-600 text-white rounded-xl font-bold">Criar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Compra no Cartão */}
      {showCardPurchaseModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-bold text-lg mb-4">Nova Compra no Cartão</h3>
            
            <input 
              placeholder="Descrição (ex: Celular)" 
              className="w-full bg-slate-50 p-3 rounded-xl mb-3" 
              value={newCardPurchase.description} 
              onChange={e=>setNewCardPurchase({...newCardPurchase, description: e.target.value})}
            />
            
            <input 
              type="number" 
              placeholder="Valor total (R$)" 
              className="w-full bg-slate-50 p-3 rounded-xl mb-3" 
              value={newCardPurchase.amount} 
              onChange={e=>setNewCardPurchase({...newCardPurchase, amount: e.target.value})}
            />
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input 
                type="number" 
                placeholder="Parcelas" 
                min="1" 
                max="48" 
                className="w-full bg-slate-50 p-3 rounded-xl" 
                value={newCardPurchase.installments} 
                onChange={e=>setNewCardPurchase({...newCardPurchase, installments: e.target.value})}
              />
              <input 
                type="date" 
                className="w-full bg-slate-50 p-3 rounded-xl" 
                value={newCardPurchase.purchaseDate} 
                onChange={e=>setNewCardPurchase({...newCardPurchase, purchaseDate: e.target.value})}
              />
            </div>
            
            <select 
              className="w-full bg-slate-50 p-3 rounded-xl mb-3" 
              value={newCardPurchase.cardId} 
              onChange={e=>setNewCardPurchase({...newCardPurchase, cardId: e.target.value})}
            >
              <option value="">Selecione o cartão</option>
              {creditCards.map(card => (
                <option key={card.firestoreId} value={card.firestoreId}>{card.name}</option>
              ))}
            </select>
            
            <select 
              className="w-full bg-slate-50 p-3 rounded-xl mb-4" 
              value={newCardPurchase.category} 
              onChange={e=>setNewCardPurchase({...newCardPurchase, category: e.target.value})}
            >
              {Object.keys(CATEGORIES).filter(c => c !== 'Renda').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            
            {newCardPurchase.amount && newCardPurchase.installments > 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded-xl">
                <p className="text-xs text-blue-600 font-medium">
                  {newCardPurchase.installments}x de R$ {(parseFloat(newCardPurchase.amount) / parseInt(newCardPurchase.installments)).toFixed(2)}
                </p>
              </div>
            )}
            
            <div className="flex gap-2">
              <button onClick={()=>setShowCardPurchaseModal(false)} className="flex-1 p-3 text-slate-500">Cancelar</button>
              <button onClick={handleAddCardPurchase} className="flex-1 p-3 bg-blue-600 text-white rounded-xl font-bold">Registrar</button>
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

      {/* Modal de Detalhes do Dia */}
      {showDayDetails !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl animate-in zoom-in-95 max-h-[80vh] flex flex-col">
            <div className="p-6 border-b shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">
                  Gastos do Dia {showDayDetails}
                </h3>
                <button onClick={() => setShowDayDetails(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-500"/>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {(() => {
                const now = new Date();
                const targetDate = new Date(now.getFullYear(), now.getMonth(), showDayDetails);
                const dateStr = targetDate.toISOString().split('T')[0];
                const dayTransactions = transactions.filter(tx => tx.date === dateStr && tx.type === 'expense');
                const totalDay = dayTransactions.reduce((acc, tx) => acc + tx.amount, 0);

                if (dayTransactions.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Sparkles className="w-8 h-8 text-emerald-600"/>
                      </div>
                      <p className="text-slate-600 font-medium">Nenhum gasto neste dia!</p>
                      <p className="text-xs text-slate-400 mt-1">Parabéns pela economia 🎉</p>
                    </div>
                  );
                }

                return (
                  <>
                    <div className="bg-rose-50 p-4 rounded-2xl mb-4">
                      <p className="text-xs text-rose-600 font-medium mb-1">Total do dia</p>
                      <p className="text-2xl font-bold text-rose-700">R$ {totalDay.toFixed(2)}</p>
                      <p className="text-xs text-slate-500 mt-1">{dayTransactions.length} transação{dayTransactions.length !== 1 ? 'ões' : ''}</p>
                    </div>

                    <div className="space-y-2">
                      {dayTransactions.map(tx => (
                        <div key={tx.firestoreId} className="bg-slate-50 p-3 rounded-xl">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-white">
                              {CATEGORIES[tx.category]?.icon || <DollarSign className="w-4 h-4"/>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-slate-800 truncate">{tx.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs bg-white px-2 py-0.5 rounded-full">{tx.category}</span>
                                {(tx.tags || []).map(tag => (
                                  <span key={tag} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">#{tag}</span>
                                ))}
                              </div>
                            </div>
                            <p className="font-bold text-rose-600">R$ {tx.amount.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Investimento */}
      {showInvestmentModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600"/> Adicionar Investimento
            </h3>
            
            {/* Tipo: Existente ou Novo Aporte */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-500 ml-1 uppercase mb-2 block">Este investimento é:</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => setNewInvestment({...newInvestment, isExisting: true})}
                  className={`flex-1 py-3 px-2 rounded-xl font-semibold transition-all text-sm ${
                    newInvestment.isExisting 
                      ? 'bg-emerald-500 text-white shadow-lg' 
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  💰 Já possuo
                </button>
                <button 
                  onClick={() => setNewInvestment({...newInvestment, isExisting: false})}
                  className={`flex-1 py-3 px-2 rounded-xl font-semibold transition-all text-sm ${
                    !newInvestment.isExisting 
                      ? 'bg-indigo-500 text-white shadow-lg' 
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  🆕 Novo aporte
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg">
                {newInvestment.isExisting 
                  ? '✓ Valor será registrado como patrimônio existente (NÃO desconta do saldo)'
                  : '⚠️ Valor será descontado do seu saldo como um novo investimento'
                }
              </p>
            </div>

            <input 
              autoFocus
              placeholder="Nome do investimento (ex: Tesouro Selic 2029)" 
              className="w-full bg-slate-50 p-3 rounded-xl mb-3" 
              value={newInvestment.name} 
              onChange={e => setNewInvestment({...newInvestment, name: e.target.value})}
            />
            
            <div className="mb-3">
              <label className="text-xs font-bold text-slate-500 ml-1 uppercase mb-1 block">Tipo de Investimento</label>
              <select 
                className="w-full bg-slate-50 p-3 rounded-xl"
                value={newInvestment.type}
                onChange={e => setNewInvestment({...newInvestment, type: e.target.value})}
              >
                <option value="Renda Fixa">Renda Fixa</option>
                <option value="Tesouro Direto">Tesouro Direto</option>
                <option value="CDB/LCI/LCA">CDB/LCI/LCA</option>
                <option value="Fundos">Fundos de Investimento</option>
                <option value="Ações">Ações</option>
                <option value="FIIs">Fundos Imobiliários</option>
                <option value="Criptomoedas">Criptomoedas</option>
                <option value="Previdência">Previdência Privada</option>
                <option value="Poupança">Poupança</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-bold text-slate-500 ml-1 uppercase mb-1 block">Valor Atual</label>
                <input 
                  type="number" 
                  placeholder="R$ 0,00" 
                  className="w-full bg-slate-50 p-3 rounded-xl" 
                  value={newInvestment.currentValue} 
                  onChange={e => setNewInvestment({...newInvestment, currentValue: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 ml-1 uppercase mb-1 block">Valor Inicial</label>
                <input 
                  type="number" 
                  placeholder="Quanto investiu" 
                  className="w-full bg-slate-50 p-3 rounded-xl" 
                  value={newInvestment.initialValue} 
                  onChange={e => setNewInvestment({...newInvestment, initialValue: e.target.value})}
                />
              </div>
            </div>
            
            <div className="mb-3">
              <label className="text-xs font-bold text-slate-500 ml-1 uppercase mb-1 block">Data do Investimento</label>
              <input 
                type="date" 
                className="w-full bg-slate-50 p-3 rounded-xl" 
                value={newInvestment.date} 
                onChange={e => setNewInvestment({...newInvestment, date: e.target.value})}
              />
            </div>

            {/* Configuração de Rendimento Automático */}
            <div className="mb-4 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                  📈 Calcular rendimento automático
                </label>
                <button 
                  onClick={() => setNewInvestment({...newInvestment, autoCalculate: !newInvestment.autoCalculate})}
                  className={`w-12 h-6 rounded-full transition-all ${newInvestment.autoCalculate ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-all ${newInvestment.autoCalculate ? 'ml-6' : 'ml-0.5'}`}></div>
                </button>
              </div>
              
              {newInvestment.autoCalculate && (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div>
                      <label className="text-[10px] font-bold text-emerald-700 ml-1 uppercase mb-1 block">Tipo de Taxa</label>
                      <select 
                        className="w-full bg-white p-2.5 rounded-xl text-sm border border-emerald-200"
                        value={newInvestment.rateType}
                        onChange={e => setNewInvestment({...newInvestment, rateType: e.target.value})}
                      >
                        <option value="fixa">Taxa Fixa (% a.a.)</option>
                        <option value="cdi">% do CDI</option>
                        <option value="selic">% da Selic</option>
                        <option value="ipca">IPCA + (% a.a.)</option>
                        <option value="poupanca">Poupança</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-emerald-700 ml-1 uppercase mb-1 block">
                        {newInvestment.rateType === 'cdi' ? '% do CDI' : 
                         newInvestment.rateType === 'selic' ? '% da Selic' :
                         newInvestment.rateType === 'ipca' ? 'IPCA +' :
                         newInvestment.rateType === 'poupanca' ? 'Taxa (fixa)' : 'Taxa Anual'}
                      </label>
                      <input 
                        type="number" 
                        placeholder={newInvestment.rateType === 'cdi' || newInvestment.rateType === 'selic' ? 'Ex: 100' : 'Ex: 12'}
                        className="w-full bg-white p-2.5 rounded-xl text-sm border border-emerald-200" 
                        value={newInvestment.annualRate} 
                        onChange={e => setNewInvestment({...newInvestment, annualRate: e.target.value})}
                        disabled={newInvestment.rateType === 'poupanca'}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-emerald-600">
                    {newInvestment.rateType === 'cdi' && '💡 CDI atual: ~13,15% a.a. (100% CDI = 13,15%)'}
                    {newInvestment.rateType === 'selic' && '💡 Selic atual: ~13,25% a.a.'}
                    {newInvestment.rateType === 'ipca' && '💡 IPCA atual: ~4,5% a.a. + sua taxa'}
                    {newInvestment.rateType === 'poupanca' && '💡 Poupança: ~7,5% a.a. (taxa fixa)'}
                    {newInvestment.rateType === 'fixa' && '💡 Informe a taxa anual fixa do investimento'}
                  </p>
                </>
              )}
            </div>
            
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-500 ml-1 uppercase mb-1 block">Observações (opcional)</label>
              <input 
                placeholder="Ex: Vence em 2029" 
                className="w-full bg-slate-50 p-3 rounded-xl" 
                value={newInvestment.notes} 
                onChange={e => setNewInvestment({...newInvestment, notes: e.target.value})}
              />
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setShowInvestmentModal(false)} 
                className="flex-1 p-3 text-slate-500"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAddInvestment} 
                className="flex-1 p-3 bg-emerald-600 text-white rounded-xl font-bold"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;