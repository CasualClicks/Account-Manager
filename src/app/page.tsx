const transactions = [
  { initials: "AK", color: "lavender", name: "Aarav Kumar", detail: "Invoice #INV-2041", time: "10:42 am", amount: "+₹18,500", type: "in" },
  { initials: "MS", color: "peach", name: "Meera Shah", detail: "Monthly supplies", time: "Yesterday", amount: "−₹7,200", type: "out" },
  { initials: "RK", color: "mint", name: "Rohan Kirana Store", detail: "Payment received", time: "Yesterday", amount: "+₹12,000", type: "in" },
  { initials: "PS", color: "blue", name: "Priya Sharma", detail: "Invoice #INV-2038", time: "24 Oct", amount: "−₹3,450", type: "out" },
];

const parties = [
  { initials: "AK", color: "lavender", name: "Aarav Kumar", role: "Customer", balance: "₹42,500", note: "You’ll receive" },
  { initials: "NK", color: "peach", name: "Nisha & Co.", role: "Supplier", balance: "₹28,000", note: "You’ll pay" },
  { initials: "RK", color: "mint", name: "Rohan Kirana Store", role: "Customer", balance: "₹16,750", note: "You’ll receive" },
];

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const shapes: Record<string, React.ReactNode> = {
    grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></>,
    people: <><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20v-1.4a5.5 5.5 0 0 1 11 0V20M16 5.3a3.2 3.2 0 0 1 0 6.2m1.2 2.3a5.3 5.3 0 0 1 3.3 4.9V20"/></>,
    swap: <><path d="M7 7h13m0 0-3-3m3 3-3 3M17 17H4m0 0 3-3m-3 3 3 3"/></>,
    chart: <><path d="M4 19V5m0 14h16M8 15l3-4 3 2 5-6"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.5.9L16 20.5h-2.8l-.4-1.8a8 8 0 0 1-1.6-.6l-1.6.8-1.8-1.9.9-1.6a8 8 0 0 1-.5-1.6l-1.7-.6v-2.7l1.8-.4a8 8 0 0 1 .7-1.5l-.8-1.7 2-1.8 1.5.9a8 8 0 0 1 1.6-.5l.6-1.7h2.7l.5 1.8a8 8 0 0 1 1.5.7l1.7-.8 1.8 2-1 1.5a8 8 0 0 1 .5 1.6l1.8.5v2.7l-1.8.5a8 8 0 0 1-.7 1.4Z" transform="translate(-1 -1) scale(.94)"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4 4"/></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4"/></>,
    plus: <><path d="M12 5v14m-7-7h14"/></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6"/></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 18v3h16v-3"/></>,
    dots: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6m-6 4h6m-6 4h3"/></>,
    box: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 8 9 5 9-5m-18 0v9l9 5 9-5V8m-9 5v9"/></>,
  };
  return <svg {...common} aria-hidden="true">{shapes[name] ?? null}</svg>;
}

function Avatar({ initials, color }: { initials: string; color: string }) {
  return <span className={`avatar ${color}`}>{initials}</span>;
}

export default function Home() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home"><span className="brand-mark"><Icon name="chart" size={21}/></span><span>ledgerly<span className="brand-dot">.</span></span></a>
        <div className="workspace-label">WORKSPACE</div>
        <button className="workbook-picker"><span className="workbook-icon"><Icon name="box" size={18}/></span><span className="workbook-name"><strong>Wholesale</strong><small>Business account</small></span><span className="picker-chevron">⌄</span></button>
        <div className="nav-label">MENU</div>
        <nav className="side-nav" aria-label="Main navigation">
          <a className="nav-item active" href="#overview"><Icon name="grid"/><span>Overview</span></a>
          <a className="nav-item" href="#parties"><Icon name="people"/><span>Parties</span><span className="nav-count">24</span></a>
          <a className="nav-item" href="#transactions"><Icon name="swap"/><span>Transactions</span></a>
          <a className="nav-item" href="#reports"><Icon name="chart"/><span>Reports</span></a>
        </nav>
        <div className="sidebar-bottom"><a className="nav-item" href="#settings"><Icon name="settings"/><span>Settings</span></a>
          <div className="upgrade-card"><span className="upgrade-spark">✦</span><strong>More room to grow</strong><p>Keep all your workbooks in one place.</p><a href="#workbooks">Explore workbooks <Icon name="arrow" size={15}/></a></div>
          <div className="profile"><Avatar initials="SK" color="dark"/><span className="profile-copy"><strong>Shiva K.</strong><small>Business owner</small></span><button className="icon-button profile-menu" aria-label="Profile menu"><Icon name="dots"/></button></div>
        </div>
      </aside>

      <section className="main-area" id="overview">
        <header className="topbar"><div className="breadcrumbs"><span>Workbooks</span><Icon name="chevron" size={15}/><strong>Wholesale</strong></div><div className="top-actions"><label className="search-box"><Icon name="search" size={18}/><input aria-label="Search" placeholder="Search anything..."/><kbd>⌘ K</kbd></label><button className="icon-button notification" aria-label="Notifications"><Icon name="bell" size={20}/><i/></button><span className="top-avatar">SK</span></div></header>
        <div className="page-content">
          <section className="welcome-row"><div><p className="eyebrow"><span className="live-dot"/> TUESDAY, 27 OCTOBER 2026</p><h1>Good morning, Shiva <span className="wave">✳</span></h1><p className="welcome-subtitle">Here’s what’s happening with your business today.</p></div><div className="welcome-actions"><button className="button button-secondary"><Icon name="download" size={17}/> Export</button><button className="button button-primary"><Icon name="plus" size={18}/> New transaction</button></div></section>
          <section className="stat-grid" aria-label="Account summary">
            <article className="stat-card"><div className="stat-heading"><span>Total receivable</span><span className="stat-icon green"><Icon name="arrow" size={17}/></span></div><strong className="stat-value">₹ 2,84,500</strong><div className="stat-foot"><span className="trend up">↗ 12.8%</span><span>vs last month</span><span className="stat-period">This month</span></div><div className="sparkline green-line"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></article>
            <article className="stat-card"><div className="stat-heading"><span>Total payable</span><span className="stat-icon amber"><Icon name="arrow" size={17}/></span></div><strong className="stat-value">₹ 1,26,800</strong><div className="stat-foot"><span className="trend down">↗ 4.2%</span><span>vs last month</span><span className="stat-period">This month</span></div><div className="sparkline amber-line"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></article>
            <article className="stat-card"><div className="stat-heading"><span>Money received</span><span className="stat-icon blue"><Icon name="download" size={17}/></span></div><strong className="stat-value">₹ 3,42,250</strong><div className="stat-foot"><span className="trend up">↗ 8.1%</span><span>vs last month</span><span className="stat-period">This month</span></div><div className="sparkline blue-line"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></article>
            <article className="stat-card"><div className="stat-heading"><span>Money paid</span><span className="stat-icon violet"><Icon name="receipt" size={17}/></span></div><strong className="stat-value">₹ 1,98,400</strong><div className="stat-foot"><span className="trend up">↗ 2.4%</span><span>vs last month</span><span className="stat-period">This month</span></div><div className="sparkline violet-line"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></article>
          </section>

          <section className="overview-grid">
            <article className="panel activity-panel" id="transactions"><div className="panel-heading"><div><h2>Recent transactions</h2><p>A quick look at your latest activity</p></div><button className="text-link">View all <Icon name="arrow" size={15}/></button></div><div className="table-wrap"><table><thead><tr><th>PARTY</th><th>DESCRIPTION</th><th>DATE</th><th className="align-right">AMOUNT</th></tr></thead><tbody>{transactions.map((item) => <tr key={item.name}><td><div className="party-cell"><Avatar initials={item.initials} color={item.color}/><span><strong>{item.name}</strong><small>{item.detail}</small></span></div></td><td className="muted-cell">{item.type === "in" ? "Payment received" : "Purchase"}</td><td className="muted-cell">{item.time}</td><td className={`amount-cell align-right ${item.type}`}>{item.amount}</td></tr>)}</tbody></table></div><a className="mobile-view-all" href="#all-transactions">See all transactions <Icon name="arrow" size={15}/></a></article>
            <article className="panel balance-panel" id="parties"><div className="panel-heading"><div><h2>Party balances</h2><p>People you do business with</p></div><button className="icon-button subtle-button" aria-label="More party balance options"><Icon name="dots" size={19}/></button></div><div className="party-list">{parties.map((party) => <div className="party-balance" key={party.name}><Avatar initials={party.initials} color={party.color}/><div className="party-balance-info"><strong>{party.name}</strong><small>{party.role}</small></div><div className="balance-number"><strong>{party.balance}</strong><small>{party.note}</small></div></div>)}</div><a className="panel-footer-link" href="#all-parties">All parties <Icon name="arrow" size={15}/></a></article>
          </section>
          <footer className="page-footer"><span>Ledgerly <span className="footer-dot">●</span> Your books, in good order.</span><span>All amounts in INR <span className="footer-divider">·</span> Last synced just now</span></footer>
        </div>
      </section>
    </main>
  );
}
