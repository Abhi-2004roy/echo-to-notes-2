import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, color } from 'framer-motion';
import { Menu, Search, Sun, Moon, Volume2, Download, Trash2, X, User, Type, Grid, Layers, LogIn, LogOut , Edit2, Check , Printer } from 'lucide-react';
//Local to Global shift
const API_URL = "https://echo-to-notes-backend-final-jgew2s05b.vercel.app";
const handlePrint = (note) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>${note.title || 'Note'}</title>
            <style>
                body { font-family: sans-serif; padding: 40px; }
                h1 { border-bottom: 2px solid #333; padding-bottom: 10px; }
                p { font-size: 1.2rem; line-height: 1.6; }
                .meta { color: #666; font-size: 0.9rem; margin-bottom: 30px; }
            </style>
        </head>
        <body>
            <h1>${note.title || 'Untitled'}</h1>
            <div class="meta">Date: ${new Date(note.date).toLocaleDateString()}</div>
            <p>${note.cleanedContent}</p>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
};
// --- HELPER: TEXT TO SPEECH ---
const speakText = (text) => {
  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utterance);
};

// --- COMPONENT: AUTH MODAL (Login/Register) ---
const AuthModal = ({ isOpen, onClose, onLogin }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        
        const users = JSON.parse(localStorage.getItem('app_users') || '[]');

        if (isRegistering) {
            // REGISTER LOGIC
            if (users.find(u => u.email === email)) {
                setError("User already exists!");
                return;
            }
            const newUser = { name, email, password };
            localStorage.setItem('app_users', JSON.stringify([...users, newUser]));
            onLogin(newUser);
            onClose();
        } else {
            // LOGIN LOGIC
            const user = users.find(u => u.email === email && u.password === password);
            if (user) {
                onLogin(user);
                onClose();
            } else {
                setError("Invalid email or password");
            }
        }
    };

    return (
        <div style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:2000,
            display:'flex', alignItems:'center', justifyContent:'center'
        }}>
            <motion.div 
                initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}}
                style={{
                    background:'var(--card-bg)', padding:'30px', borderRadius:'16px', 
                    width:'350px', border:'1px solid var(--subtext)'
                }}
            >
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
                    <h2 style={{color:'var(--text)', margin:0}}>{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
                    <button onClick={onClose} className="icon-btn"><X/></button>
                </div>
                
                <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                    {isRegistering && (
                        <input placeholder="Full Name" required value={name} onChange={e=>setName(e.target.value)} 
                            style={{padding:'10px', borderRadius:'8px', border:'1px solid #ccc'}}/>
                    )}
                    <input type="email" placeholder="Email" required value={email} onChange={e=>setEmail(e.target.value)}
                        style={{padding:'10px', borderRadius:'8px', border:'1px solid #ccc'}}/>
                    <input type="password" placeholder="Password" required value={password} onChange={e=>setPassword(e.target.value)}
                        style={{padding:'10px', borderRadius:'8px', border:'1px solid #ccc'}}/>
                    
                    {error && <p style={{color:'red', fontSize:'0.8rem'}}>{error}</p>}

                    <button type="submit" style={{
                        padding:'12px', background:'var(--accent)', color:'white', 
                        border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer'
                    }}>
                        {isRegistering ? 'Sign Up' : 'Log In'}
                    </button>
                </form>

                <p style={{marginTop:'15px', textAlign:'center', fontSize:'0.9rem', color:'var(--subtext)'}}>
                    {isRegistering ? "Already have an account? " : "No account yet? "}
                    <span 
                        onClick={() => setIsRegistering(!isRegistering)}
                        style={{color:'var(--accent)', cursor:'pointer', fontWeight:'bold'}}
                    >
                        {isRegistering ? 'Login' : 'Register'}
                    </span>
                </p>
            </motion.div>
        </div>
    );
};

// --- COMPONENT: SWIPEABLE CARD ---
const Card = ({ note, index, onStash, onUnstash, onDelete, onUpdate, isSearchActive, theme, font }) => {
  const x = useMotionValue(0);
  const targetX = note.isStashed ? 280 : 0;
  const scale = note.isStashed ? 0.85 : 1;
  const opacity = note.isStashed ? 0.7 : 1;
  const rotateVal = note.isStashed ? 5 + (index * 2) : 0; 
  
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title);
  const [editContent, setEditContent] = useState(note.cleanedContent);

  const handleSave = () => {
      onUpdate(note.id, editTitle, editContent);
      setIsEditing(false);
  };

  const cardStyle = {
    position: 'absolute',
    top: 0, left: 0, width: '100%', height: '100%',
    background: theme === 'dark' 
      ? 'linear-gradient(135deg, #e94999ff, #8b5cf6)' 
      : 'linear-gradient(to bottom right, #B0C4DE, #ffffff)',
    color: 'white',
    border: theme === 'dark' ? '1px solid #7c23cfff' : '1px solid #999',
    boxShadow: '0 4px 15px rgba(169, 10, 218, 1)',
    fontFamily: font,
    borderRadius: '20px', padding: '20px', boxSizing: 'border-box',
    
    // 👇 FIX 1: HIGH Z-INDEX WHEN EDITING SO YOU CAN CLICK IT
    zIndex: isEditing ? 1000 : (note.isStashed ? 0 : 100 - index), 
  };

  const textStrokeStyle = theme === 'dark' ? {} : { WebkitTextStroke: '0.25px purple' };
  const textStyle = { color: 'black', ...textStrokeStyle };

  const handleDragEnd = (event, info) => {
    if(isEditing) return;
    if (note.isStashed) { if (info.offset.x < -50) onUnstash(note.id); } 
    else { if (info.offset.x > 100) onStash(note.id); }
  };

  return (
    <motion.div
      style={{ x, ...cardStyle }} 
      drag={isEditing ? false : "x"} 
      dragConstraints={{ left: note.isStashed ? -300 : 0, right: note.isStashed ? 0 : 300 }}
      onDragEnd={handleDragEnd} 
      className="card"
      initial={false} animate={{ x: targetX, scale, opacity, rotate: rotateVal, y: note.isStashed ? index * 10 : index * -10 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <div style={{height: '100%', display:'flex', flexDirection:'column'}}>
        
        {/* HEADER */}
        <div style={{marginBottom: '10px'}}>
            <h3 style={{color: theme==='dark'?'rgba(0, 0, 0, 0.7)':'#555', fontSize: '0.8rem', marginBottom:'5px'}}>
                {new Date(note.date).toLocaleDateString()}
            </h3>
            {isEditing ? (
                <input 
                    value={editTitle} 
                    onChange={(e) => setEditTitle(e.target.value)}
                    // 👇 FIX 2: Stop drag when clicking input
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{
                        width: '100%', background: 'rgba(255,255,255,0.2)', 
                        border: 'none', color: 'white', fontSize: '1.8rem', fontWeight: 'bold',
                        padding: '5px', borderRadius: '5px'
                    }}
                />
            ) : (
                <h1 style={{fontSize: '1.8rem', margin: '0', fontWeight: 'bold', ...textStyle}}>
                    {note.title || "Untitled"}
                </h1>
            )}
        </div>

        {/* CONTENT */}
        <div style={{flex: 1, overflowY: 'auto', marginBottom: '15px'}}>
            {isEditing ? (
                <textarea 
                    value={editContent} 
                    onChange={(e) => setEditContent(e.target.value)}
                    // 👇 FIX 2: Stop drag when clicking textarea
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{
                        width: '100%', height: '100%', background: 'rgba(255, 255, 255, 0.2)', 
                        border: 'none', color: 'white', fontSize: '1.1rem', resize: 'none',
                        padding: '5px', borderRadius: '5px', fontFamily: font
                    }}
                />
            ) : (
                <p style={{fontSize: '1.1rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', ...textStyle}}>
                    {note.cleanedContent}
                </p>
            )}
        </div>
      
        {/* ACTIONS FOOTER */}
        <div className="card-actions" style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
             {isEditing ? (
                 <button 
        className="icon-btn" 
        onClick={(e) => { e.stopPropagation(); handleSave(); }} 
        onPointerDown={(e) => e.stopPropagation()}
        title="Save" 
        style={{color: '#4ade80', cursor: 'pointer', zIndex: 1001}}
     >
        <Check size={24} />
     </button>
) : (
    <>
       {/* REPLACE THIS BUTTON */}
       <button className="icon-btn" onClick={() => handlePrint(note)} title="Print Note" style={{color: 'white'}}>
           <Printer size={20} />
       </button>
       
       {/* Keep existing Edit/Delete buttons */}
       <button className="icon-btn" onClick={() => setIsEditing(true)} title="Edit" style={{color: 'white'}}>
           <Edit2 size={20} />
       </button>
       <button className="icon-btn" onClick={() => onDelete(note.id)} title="Delete" style={{color: '#ff4444'}}>
           <Trash2 size={20} />
       </button>
    </>
)}
        </div>
        
        {note.isStashed && (
          <div style={{position:'absolute', left: -30, top: '50%', transform: 'rotate(-90deg)', color: 'var(--subtext)', fontWeight:'bold'}}>STASHED</div>
        )}
      </div>
    </motion.div>
  );
};
// --- COMPONENT: GRID VIEW (View All) ---
const GridView = ({ notes, theme, font, onDelete }) => {
  const textStrokeStyle = theme === 'dark' ? {} : { WebkitTextStroke: '0.4px black' };
    return (
        <div style={{
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
            gap: '15px', 
            padding: '20px',
            width: '100%',
            height : '100%',
            overflowY: 'auto'
        }}>
            {notes.map(note => (
                <motion.div 
                    key={note.id}
                    initial={{opacity: 0, scale: 0.9}} animate={{opacity: 1, scale: 1}}
                    style={{
                        // 2. UPDATE BACKGROUND: Use the same Gradient logic
                        background: theme === 'dark' 
                            ? 'linear-gradient(135deg, #ec4899, #8b5cf6)' 
                            : 'linear-gradient(to bottom right, #B0C4DE, #ffffff)',
                        color: 'black',
                        
                        borderRadius: '12px', padding: '15px',
                        display: 'flex', flexDirection: 'column',
                        height: '200px', 
                        boxShadow: '0 2px 10px rgba(204, 0, 255, 1)',
                        fontFamily: font,
                        border: theme === 'dark' ? '1px solid #000' : '1px solid #999',
                        position: 'relative'
                    }}
                >
                    <h3 style={{fontSize:'0.7rem', opacity: 0.8, marginBottom: '5px'}}>
                        {new Date(note.date).toLocaleDateString()}
                    </h3>
                    
                    {/* 4. APPLY TEXT STROKE to Title */}
                    <h2 style={{
                        fontSize:'1rem', 
                        fontWeight:'bold', 
                        margin:'0 0 5px 0', 
                        overflow:'hidden', 
                        textOverflow:'ellipsis', 
                        whiteSpace:'nowrap',
                        ...textStrokeStyle 
                    }}>
                        {note.title || "Untitled"}
                    </h2>
                    
                    {/* 5. APPLY TEXT STROKE to Body */}
                    <p style={{
                        fontSize:'0.8rem', 
                        opacity: 0.9, 
                        overflow:'hidden', 
                        flex:1,
                        ...textStrokeStyle
                    }}>
                        {note.cleanedContent}
                    </p>

                    {/* Delete Mini Button - Updated color to be visible on gradient */}
                    <button 
                        onClick={() => onDelete(note.id)}
                        style={{
                            position:'absolute', bottom:'10px', right:'10px', 
                            background:'transparent', border:'none', 
                            color: 'black', 
                            cursor:'pointer',
                            filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.5))'
                        }}
                    >
                        <Trash2 size={16}/>
                    </button>

                    {/* ACTIONS CONTAINER (Bottom Right) */}
                      <div style={{position:'absolute', bottom:'10px', right:'10px', display:'flex', gap:'5px'}}>
                          
                          {/* New Print Button */}
                          <button 
                              onClick={() => handlePrint(note)}
                              style={{
                                  background:'transparent', border:'none', color:'white', cursor:'pointer',
                                  filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.5))'
                              }}
                          >
                              <Printer size={16}/>
                          </button>

                          {/* Existing Delete Button */}
                          <button 
                              onClick={() => onDelete(note.id)}
                              style={{
                                  background:'transparent', border:'none', color:'white', cursor:'pointer',
                                  filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.5))'
                              }}
                          >
                              <Trash2 size={16}/>
                          </button>
    </div>
                    
                    {note.isStashed && (
                        <div style={{
                            fontSize:'0.6rem', background:'rgba(0,0,0,0.5)', 
                            padding:'2px 5px', borderRadius:'4px', 
                            position:'absolute', top:'10px', right:'10px', color:'white'
                        }}>
                            STASHED
                        </div>
                    )}
                </motion.div>
            ))}
        </div>
    );
};

// --- SIDEBAR MENU ---
const Sidebar = ({ isOpen, onClose, user, onLoginClick, onLogout, font, setFont, theme, toggleTheme, viewMode, setViewMode }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={onClose} style={{position:'fixed', inset:0, background:'black', zIndex: 1000}} />
                    <motion.div
                        initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                        style={{
                            position:'fixed', left:0, top:0, bottom:0, width:'280px',
                            background: theme === 'dark' ? '#1a1a1a' : 'white',
                            zIndex: 1001, padding: '20px', display: 'flex', flexDirection: 'column',
                            boxShadow: '4px 0 15px rgba(0,0,0,0.3)'
                        }}
                    >
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
                            <h2 style={{fontSize:'1.5rem', fontWeight:'bold', color: theme === 'dark'?'white':'black'}}>Menu</h2>
                            <button onClick={onClose} className="icon-btn"><X size={24} color={theme==='dark'?'white':'black'} /></button>
                        </div>

                        {/* Profile Section */}
                        <div style={{marginBottom:'20px', padding:'15px', borderRadius:'12px', background: theme==='dark'?'#333':'#f3f4f6', display:'flex', alignItems:'center', gap:'15px'}}>
                            <div style={{width:'40px', height:'40px', borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', color:'white'}}>
                                <User size={20} />
                            </div>
                            <div style={{flex:1, overflow:'hidden'}}>
                                <p style={{fontWeight:'bold', color: theme==='dark'?'white':'black', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{user ? user.name : "Guest"}</p>
                                {user ? (
                                    <button onClick={onLogout} style={{fontSize:'0.8rem', color:'#ff4444', background:'none', border:'none', padding:0, cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}>
                                        <LogOut size={12}/> Logout
                                    </button>
                                ) : (
                                    <button onClick={onLoginClick} style={{fontSize:'0.8rem', color:'var(--accent)', background:'none', border:'none', padding:0, cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}>
                                        <LogIn size={12}/> Login / Register
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* View Toggle */}
                        <div style={{marginBottom:'30px'}}>
                            <h3 style={{color:'var(--subtext)', fontSize:'0.9rem', marginBottom:'10px'}}>View Mode</h3>
                            <button 
                                onClick={() => { setViewMode('stack'); onClose(); }}
                                style={{
                                    width:'100%', padding:'10px', marginBottom:'5px', borderRadius:'8px', border:'none', 
                                    background: viewMode==='stack' ? 'var(--accent)' : 'transparent',
                                    color: viewMode==='stack' ? 'white' : 'var(--subtext)',
                                    display:'flex', alignItems:'center', gap:'10px', cursor:'pointer'
                                }}
                            >
                                <Layers size={18}/> Stack View
                            </button>
                            <button 
                                onClick={() => { setViewMode('grid'); onClose(); }}
                                style={{
                                    width:'100%', padding:'10px', borderRadius:'8px', border:'none', 
                                    background: viewMode==='grid' ? 'var(--accent)' : 'transparent',
                                    color: viewMode==='grid' ? 'white' : 'var(--subtext)',
                                    display:'flex', alignItems:'center', gap:'10px', cursor:'pointer'
                                }}
                            >
                                <Grid size={18}/> View All (Grid)
                            </button>
                        </div>

                        {/* Font Settings */}
                        <div style={{marginBottom:'30px'}}>
                            <h3 style={{display:'flex', alignItems:'center', gap:'10px', color:'var(--subtext)', marginBottom:'10px'}}><Type size={18} /> Font</h3>
                            <div style={{display:'flex', gap:'10px'}}>
                                {['sans-serif', 'serif', 'monospace'].map(f => (
                                    <button key={f} onClick={() => setFont(f)} style={{
                                            flex:1, padding:'8px', borderRadius:'8px', border:'1px solid var(--subtext)',
                                            background: font === f ? 'var(--accent)' : 'transparent',
                                            color: font === f ? 'white' : (theme==='dark'?'white':'black'),
                                            fontFamily: f, cursor:'pointer'
                                    }}>Aa</button>
                                ))}
                            </div>
                        </div>

                        {/* Theme */}
                        <div style={{marginTop:'auto'}}>
                            <div onClick={toggleTheme} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'15px', borderRadius:'12px', background: theme==='dark'?'#333':'#f3f4f6', cursor:'pointer'}}>
                                <span style={{display:'flex', alignItems:'center', gap:'10px', color: theme==='dark'?'white':'black'}}>
                                    {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />} {theme === 'dark' ? 'Dark' : 'Light'}
                                </span>
                                <div style={{width:'40px', height:'20px', borderRadius:'20px', background: theme==='dark' ? 'var(--accent)' : '#ccc', position:'relative'}}>
                                    <div style={{width:'16px', height:'16px', borderRadius:'50%', background:'white', position:'absolute', top:'2px', left: theme==='dark' ? '22px' : '2px', transition: 'left 0.2s'}} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// --- MAIN APP ---
export default function App() {
  const [notes, setNotes] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [search, setSearch] = useState('');
  const [theme, setTheme] = useState('dark');
  const [font, setFont] = useState('sans-serif');
  
  // New States for this update
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('stack'); // 'stack' or 'grid'

  const recognitionRef = useRef(null);

  // Load Data
  useEffect(() => {
    const saved = localStorage.getItem('voiceNotes');
    if (saved) setNotes(JSON.parse(saved));
    const savedUser = localStorage.getItem('app_current_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // Auto-save Notes
  useEffect(() => {
    localStorage.setItem('voiceNotes', JSON.stringify(notes));
  }, [notes]);

  // Theme Body Class
  useEffect(() => {
    document.body.className = theme === 'light' ? 'light-mode' : '';
  }, [theme]);

  // Voice Setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; 
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => setIsRecording(true);
      recognitionRef.current.onend = () => setIsRecording(false);
      
      recognitionRef.current.onresult = async (event) => {
        const currentResultIndex = event.resultIndex;
        const transcript = event.results[currentResultIndex][0].transcript;
        if(event.results[currentResultIndex].isFinal){
          if(transcript.toLowerCase().includes("note this")){
            const cleanText = transcript.replace(/note this/gi, '').trim();
            if (cleanText) await processNote(cleanText);
          }
        }
      };
    }
  }, []);

  const processNote = async (text) => {
    const tempId = Date.now();
    const tempNote = { id: tempId, date: new Date(), title: "Processing...", cleanedContent: text, keywords: [], isStashed: false };
    setNotes(prev => [tempNote, ...prev]);

    try {
      const res = await fetch(`${API_URL}/clean-note`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text })
      });
      if (!res.ok) throw new Error("Server Error");
      const data = await res.json();
      setNotes(prev => prev.map(n => n.id === tempId ? { ...n, title: data.keywords[0] || "Note", cleanedContent: data.cleanedContent, keywords: data.keywords } : n));
    } catch (e) {
      console.error("AI Failed", e);
    }
  };

  const toggleStash = (id) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isStashed: !n.isStashed } : n));
  };

  const deleteNote = (id) => {
    if(window.confirm("Delete this note?")) setNotes(prev => prev.filter(n => n.id !== id));
  };
  
  const updateNote = (id, newTitle, newContent) => {
    setNotes(prev => prev.map(n => 
        n.id === id ? { ...n, title: newTitle, cleanedContent: newContent } : n
    ));
  };

  const toggleRecord = () => {
    if (isRecording) recognitionRef.current.stop(); else recognitionRef.current.start();
  };

  const handleLogin = (userData) => {
      setUser(userData);
      localStorage.setItem('app_current_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('app_current_user');
  };

  // Search Logic (Works for both Stack and Grid)
  const isSearchActive = search.length > 0;
  const searchResults = notes.filter(n => 
    n.cleanedContent.toLowerCase().includes(search.toLowerCase()) || 
    n.keywords?.some(k => k.toLowerCase().includes(search.toLowerCase()))
  );

  const activeStack = searchResults.filter(n => !n.isStashed);
  const stashedStack = searchResults.filter(n => n.isStashed);

return (
  <div className="app-container" style={{
      height: '100vh',         
      display: 'flex',         
      flexDirection: 'column',  
      overflow: 'hidden',       
      background: theme === 'dark' ? '#111' : 'white' 
  }}>
    
    {/* --- TOP SECTION: MENU, LOGO, SEARCH --- */}
    <div style={{ flexShrink: 0, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
      {/* Menu Button (Absolute top-left of this section) */}
      <div style={{position: 'absolute', top: '20px', left: '20px'}}>
        <button onClick={() => setIsMenuOpen(true)} className="icon-btn">
          <Menu color="var(--text)" size={32} />
        </button>
      </div>

      {/* Giant Logo */}
      <h1 className="giant-logo" style={{marginTop: '10px'}}>ECHO TO NOTES</h1>

      {/* Search Bar */}
      <div style={{ position: 'relative', width: '60%', maxWidth: '600px' }}>
        <input 
          className="search-bar" 
          placeholder="Search..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
        <Search 
          color="#999" 
          size={24} 
          style={{position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none'}} 
        />
      </div>
    </div>

    {/* --- MIDDLE SECTION: CARD STACK --- */}
    <div className="card-stack-container" style={{
        flex: 1,                    
        position: 'relative',       
        display: 'flex',            
        justifyContent: 'center',   
        alignItems: 'center',       
        width: '100%',
        minHeight: 0,  
    overflow: 'hidden' 
    }}>
      {/* Sidebars/Modals stay loaded but hidden/fixed */}
      <Sidebar 
          isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)}
          user={user} onLoginClick={() => setIsAuthModalOpen(true)} onLogout={handleLogout}
          font={font} setFont={setFont} theme={theme} toggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
          viewMode={viewMode} setViewMode={setViewMode}
      />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLogin={handleLogin} />

      {/* The Cards */}
      {viewMode === 'grid' ? (
          <GridView notes={searchResults} theme={theme} font={font} onDelete={deleteNote} />
      ) : (
          <div style={{ position: 'relative', width: '300px', height: '400px' }}> 
            {/* ^ Wrapper to hold the stack size so they don't fly away */}
            <AnimatePresence>
                {stashedStack.map((note, index) => (
                    <Card key={note.id} note={note} index={index} onStash={toggleStash} onUnstash={toggleStash} onDelete={deleteNote} isSearchActive={isSearchActive} theme={theme} font={font} />
                ))}
                {activeStack.length > 0 ? (
                    activeStack.slice(0, 3).map((note, index) => (
                        <Card key={note.id} note={note} index={index} onUpdate={updateNote} onStash={toggleStash} onUnstash={toggleStash} onDelete={deleteNote} isSearchActive={isSearchActive} theme={theme} font={font} />
                    ))
                ) : (
                    stashedStack.length === 0 && <div style={{color: 'var(--subtext)', textAlign: 'center'}}>Tap the mic to start!</div>
                )}
            </AnimatePresence>
          </div>
      )}
    </div>

    {/* --- BOTTOM SECTION: CONTROLS --- */}
    <div className="controls" style={{
        flexShrink: 0, 
        padding: '30px', 
        display: 'flex', 
        justifyContent: 'center',
        background: 'transparent' /* Ensure it doesn't block background */
    }}>
      <button className="record-btn" onClick={toggleRecord} style={{ background: isRecording ? '#ff4444' : 'var(--accent)' }}>
        {isRecording ? 'Stop Listening' : '🎤 New Note'}
      </button>
    </div>

  </div>
);
}