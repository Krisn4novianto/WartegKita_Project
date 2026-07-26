export default function Dashboard() {
  return (
    <>
      <h1>Admin Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card"><span>Total Customer</span><strong>1,240</strong></div>
        <div className="stat-card"><span>Total Seller</span><strong>120</strong></div>
        <div className="stat-card"><span>Total Order</span><strong>5,430</strong></div>
        <div className="stat-card"><span>Revenue</span><strong>Rp120M</strong></div>
      </div>
    </>
  );
}
