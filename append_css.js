const fs = require('fs');

const cssToAppend = `

/* ==========================================================
   PREMIUM LOGISTICS DASHBOARD REDESIGN STYLES
   ========================================================== */

/* Top Row Container */
.topRowCards {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 20px;
    margin-bottom: 20px;
}

@media (max-width: 900px) {
    .topRowCards {
        grid-template-columns: 1fr;
    }
}

/* Premium Profile Hero Card */
.premiumProfileCard {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 24px;
    display: flex;
    align-items: flex-start;
    gap: 24px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.premiumAvatarWrap {
    position: relative;
    width: 100px;
    height: 100px;
    flex-shrink: 0;
}

.premiumAvatar {
    width: 100px;
    height: 100px;
    border-radius: 12px;
    background: #f1f5f9;
    color: #0f172a;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    font-weight: 800;
    overflow: hidden;
    border: 1px solid #e2e8f0;
}

.premiumAvatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.premiumCameraButton {
    position: absolute;
    right: -8px;
    bottom: -8px;
    width: 32px;
    height: 32px;
    background: #0f172a;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 8px rgba(15, 23, 42, 0.2);
}

.premiumProfileInfo {
    flex-grow: 1;
}

.premiumNameRow {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 4px;
}

.premiumNameRow h2 {
    font-size: 22px;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
}

.premiumProBadge {
    background: #eff6ff;
    color: #2563eb;
    font-size: 10px;
    font-weight: 800;
    padding: 4px 8px;
    border-radius: 4px;
    letter-spacing: 0.5px;
}

.premiumRole {
    font-size: 15px;
    color: #334155;
    font-weight: 600;
    margin: 0 0 16px 0;
}

.premiumMetaRow {
    display: flex;
    gap: 24px;
    margin-bottom: 20px;
}

.premiumMetaItem {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #64748b;
    font-weight: 500;
}

.premiumActionRow {
    display: flex;
    gap: 12px;
}

.premiumEditBtn {
    background: #ffffff;
    color: #0f172a;
    border: 1px solid #cbd5e1;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.premiumEditBtn:hover {
    background: #f8fafc;
    border-color: #94a3b8;
}

.premiumSettingsBtn {
    background: transparent;
    color: #64748b;
    border: none;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
}

.premiumSettingsBtn:hover {
    color: #0f172a;
}

/* Premium Wallet Card */
.premiumWalletCard {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    display: flex;
    flex-direction: column;
}

.walletHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.walletHeaderLeft {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #475569;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.5px;
}

.walletDots {
    color: #94a3b8;
    cursor: pointer;
}

.walletBody {
    margin-bottom: 24px;
}

.walletLabel {
    display: block;
    font-size: 13px;
    color: #64748b;
    margin-bottom: 4px;
}

.walletAmount {
    font-size: 32px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.5px;
}

.walletActions {
    display: flex;
    gap: 12px;
    margin-top: auto;
}

.walletRechargeBtn {
    flex: 1;
    background: #0f172a;
    color: #ffffff;
    border: none;
    padding: 10px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
}

.walletHistoryBtn {
    flex: 1;
    background: #f1f5f9;
    color: #334155;
    border: none;
    padding: 10px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
}

/* Middle Row Cards */
.middleRowCards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
}

@media (max-width: 900px) {
    .middleRowCards {
        grid-template-columns: 1fr;
    }
}

.premiumInfoCard, .premiumPerformanceCard {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    display: flex;
    flex-direction: column;
}

.premiumCardHeader {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    color: #0f172a;
}

.premiumCardHeader h3 {
    font-size: 15px;
    font-weight: 700;
    margin: 0;
}

/* Info Card */
.premiumInfoBox {
    background: #f8fafc;
    border-radius: 8px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 12px;
}

.premiumInfoBox:last-child {
    margin-bottom: 0;
}

.infoBoxIcon {
    width: 32px;
    height: 32px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
}

.infoBoxContent span {
    display: block;
    font-size: 11px;
    color: #64748b;
    font-weight: 700;
    margin-bottom: 2px;
}

.infoBoxContent strong {
    display: block;
    font-size: 14px;
    color: #0f172a;
    font-weight: 600;
}

/* Performance Card */
.performanceGrid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 20px;
}

.performanceBox {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px;
}

.performanceBox span {
    display: block;
    font-size: 11px;
    color: #64748b;
    font-weight: 700;
    margin-bottom: 8px;
}

.performanceValueRow {
    display: flex;
    align-items: baseline;
    gap: 8px;
}

.performanceValueRow strong {
    font-size: 24px;
    font-weight: 800;
    color: #0f172a;
}

.trendGreen {
    color: #10b981;
    font-size: 12px;
    font-weight: 700;
}

.performanceValueRow small:not(.trendGreen) {
    color: #64748b;
    font-size: 11px;
    font-weight: 700;
}

.premiumAuditBtn {
    background: #ffffff;
    border: 1px dashed #cbd5e1;
    color: #475569;
    padding: 12px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    width: 100%;
    cursor: pointer;
    margin-top: auto;
    transition: all 0.2s;
}

.premiumAuditBtn:hover {
    background: #f8fafc;
    border-color: #94a3b8;
    color: #0f172a;
}

/* Ledger Card */
.premiumLedgerCard {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.ledgerHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.ledgerHeader h3 {
    font-size: 16px;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
}

.viewAllBtn {
    background: transparent;
    border: none;
    color: #475569;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
}

.viewAllBtn:hover {
    color: #0f172a;
}

.ledgerTableWrap {
    overflow-x: auto;
}

.ledgerTable {
    width: 100%;
    border-collapse: collapse;
}

.ledgerTable th {
    text-align: left;
    padding: 12px 0;
    font-size: 11px;
    color: #64748b;
    font-weight: 700;
    border-bottom: 1px solid #e2e8f0;
}

.ledgerTable td {
    padding: 16px 0;
    border-bottom: 1px solid #f1f5f9;
    font-size: 13px;
}

.ledgerTable tr:last-child td {
    border-bottom: none;
}

.ledgerTxId {
    color: #64748b;
    font-family: ui-monospace, SFMono-Regular, monospace;
}

.ledgerDesc {
    color: #0f172a;
    font-weight: 600;
}

.ledgerDate {
    color: #64748b;
}

.ledgerPill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
}

.pillCOMPLETED {
    background: #ecfdf5;
    color: #059669;
}

.pillPENDING {
    background: #fef3c7;
    color: #d97706;
}

.pillFAILED {
    background: #fef2f2;
    color: #dc2626;
}

.pillDEFAULT {
    background: #f1f5f9;
    color: #475569;
}

.pillIcon {
    flex-shrink: 0;
}

.alignRight {
    text-align: right !important;
}

.ledgerAmount {
    text-align: right;
    font-weight: 800;
    color: #0f172a;
}
`;

fs.appendFileSync('c:\\Users\\singh\\Downloads\\veru-inventory-main\\veru-inventory-main\\src\\app\\profile\\profile.module.css', cssToAppend);
console.log('Appended CSS styles successfully.');
