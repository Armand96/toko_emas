import { useState } from "react";
import {
    BuildingsIcon,
    CaretDownIcon,
    MoneyIcon,
    CreditCardIcon,
} from "@phosphor-icons/react";
import HelperFunctions from "../../../../utils/HelperFunctions";

/**
 * Daftar saldo per cabang yang bisa diexpand untuk melihat tiap akun (kas/bank).
 *
 * @param {Array<{
 *   id:number, name:string, location:string,
 *   accounts: Array<{id:number, name:string, type:"cash"|"bank", subtitle:string, balance:number}>
 * }>} branches
 * @param {number} [defaultOpenId]
 */
const BranchAccountAccordion = ({ branches = [], defaultOpenId = null }) => {
    const [openId, setOpenId] = useState(defaultOpenId);

    const branchTotal = (branch) =>
        branch.accounts.reduce((acc, a) => acc + (Number(a.balance) || 0), 0);

    return (
        <div className="flex flex-col gap-3">
            {branches.map((branch) => {
                const isOpen = openId === branch.id;
                return (
                    <div
                        key={branch.id}
                        className={`overflow-hidden rounded-lg border bg-neutral-white transition-colors ${isOpen ? "border-primary-300 ring-1 ring-primary-100" : "border-gray-200"}`}
                    >
                        <button
                            type="button"
                            onClick={() => setOpenId(isOpen ? null : branch.id)}
                            className={`flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors ${isOpen ? "bg-primary-50/60" : "hover:bg-gray-50"}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-500 text-neutral-white">
                                    <BuildingsIcon size={22} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-950">{branch.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {branch.location} • {branch.accounts.length} akun
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-base font-semibold text-gray-950">
                                    {HelperFunctions.formatCurrency(branchTotal(branch))}
                                </span>
                                <CaretDownIcon
                                    size={18}
                                    className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                                />
                            </div>
                        </button>

                        {isOpen && (
                            <div className="divide-y divide-gray-100 border-t border-gray-100">
                                {branch.accounts.map((acc) => (
                                    <div key={acc.id} className="flex items-center justify-between gap-3 px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                                                {acc.type === "cash" ? <MoneyIcon size={18} /> : <CreditCardIcon size={18} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{acc.name}</p>
                                                <p className="text-xs text-gray-400">{acc.subtitle}</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">
                                            {HelperFunctions.formatCurrency(acc.balance)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default BranchAccountAccordion;
