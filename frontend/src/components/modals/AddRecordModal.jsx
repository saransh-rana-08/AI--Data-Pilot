import React, { useState, useEffect } from 'react';
import { 
  X, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  Database, 
  Key, 
  ShieldCheck, 
  Code2, 
  Calendar, 
  Hash, 
  Type, 
  ToggleLeft,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';

export default function AddRecordModal({ isOpen, onClose, table, onRecordInserted }) {
  const { validateTableRow, insertRecord, addToast, dbConfig } = useDatabase();

  // Steps: 1: 'input' (Enter data & validate) -> 2: 'review' (Verify added data & approve) -> 3: 'success'
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [autoGenFields, setAutoGenFields] = useState({});
  const [errors, setErrors] = useState({});
  const [isValidating, setIsValidating] = useState(false);
  const [isInserting, setIsInserting] = useState(false);
  const [previewSql, setPreviewSql] = useState('');
  const [cleanedData, setCleanedData] = useState({});
  const [insertedRow, setInsertedRow] = useState(null);

  // Initialize form fields when modal opens or table changes
  useEffect(() => {
    if (isOpen && table) {
      setStep(1);
      setErrors({});
      setPreviewSql('');
      setCleanedData({});
      setInsertedRow(null);

      const initialValues = {};
      const initialAutoGen = {};

      (table.columns || []).forEach(col => {
        const isAuto = Boolean(
          col.autoincrement || 
          (col.isPrimary && (col.defaultVal || '').toLowerCase().includes('nextval')) ||
          (col.defaultVal || '').toLowerCase().includes('auto_increment')
        );

        if (isAuto) {
          initialAutoGen[col.name] = true;
          initialValues[col.name] = '';
        } else if (col.type && col.type.toLowerCase().includes('date') && !col.defaultVal) {
          // Pre-populate today's date for date columns as friendly default
          initialValues[col.name] = new Date().toISOString().split('T')[0];
        } else {
          initialValues[col.name] = '';
        }
      });

      setFormData(initialValues);
      setAutoGenFields(initialAutoGen);
    }
  }, [isOpen, table]);

  if (!isOpen || !table) return null;

  const handleInputChange = (colName, val) => {
    setFormData(prev => ({ ...prev, [colName]: val }));
    // Clear error for field once user starts typing
    if (errors[colName]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[colName];
        return next;
      });
    }
  };

  const toggleAutoGen = (colName) => {
    setAutoGenFields(prev => {
      const nextState = !prev[colName];
      if (nextState) {
        // Clear manual value if switching back to auto-gen
        setFormData(f => ({ ...f, [colName]: '' }));
      }
      return { ...prev, [colName]: nextState };
    });
  };

  // Client-side + Server-side validation check
  const handleValidateAndProceed = async () => {
    const newErrors = {};
    const payloadData = {};

    // 1. Client-side sanity checks
    (table.columns || []).forEach(col => {
      const cName = col.name;
      const cType = (col.type || '').toUpperCase();
      const val = formData[cName];
      const isAuto = autoGenFields[cName];
      const isRequired = !col.nullable && !isAuto && !col.defaultVal;

      if (isAuto) {
        // Skip auto-generated sequence IDs
        return;
      }

      const isEmpty = val === undefined || val === null || String(val).trim() === '';

      if (isRequired && isEmpty) {
        newErrors[cName] = `Field '${cName}' is required and cannot be empty.`;
        return;
      }

      if (!isEmpty) {
        const strVal = String(val).trim();
        // Check integer
        if (cType.includes('INT') || cType.includes('SERIAL')) {
          if (!/^-?\d+$/.test(strVal)) {
            newErrors[cName] = `Must be a valid whole number (integer).`;
            return;
          }
          payloadData[cName] = parseInt(strVal, 10);
        } 
        // Check float / numeric / decimal
        else if (cType.includes('NUMERIC') || cType.includes('DECIMAL') || cType.includes('FLOAT') || cType.includes('DOUBLE')) {
          if (isNaN(Number(strVal))) {
            newErrors[cName] = `Must be a valid decimal number.`;
            return;
          }
          payloadData[cName] = parseFloat(strVal);
        }
        // Check date
        else if (cType.includes('DATE') && !cType.includes('TIME')) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(strVal)) {
            newErrors[cName] = `Must be in YYYY-MM-DD format.`;
            return;
          }
          payloadData[cName] = strVal;
        } else {
          payloadData[cName] = strVal;
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addToast('Validation Incomplete', 'Please fill in all required cells with valid values.', 'warning');
      return;
    }

    // 2. Server-side validation & preview generation
    setIsValidating(true);
    try {
      const valRes = await validateTableRow(table.name, payloadData);
      if (!valRes.valid) {
        setErrors(valRes.errors || { _general: valRes.message });
        addToast('Validation Error', valRes.message || 'Data did not satisfy constraints.', 'error');
        setIsValidating(false);
        return;
      }

      setPreviewSql(valRes.preview_sql || '');
      setCleanedData(payloadData);
      setErrors({});
      // Advance to review step
      setStep(2);
    } catch (err) {
      console.error('Validation request failed:', err);
      // Fallback preview SQL if offline or network error
      const isPg = (dbConfig?.type || '').toLowerCase().includes('postgr');
      const quote = isPg ? '"' : '`';
      const cols = Object.keys(payloadData);
      const colsStr = cols.map(c => `${quote}${c}${quote}`).join(', ');
      const valsStr = cols.map(c => {
        const v = payloadData[c];
        return typeof v === 'number' ? v : `'${String(v).replace(/'/g, "''")}'`;
      }).join(', ');
      setPreviewSql(`INSERT INTO ${quote}${table.name}${quote} (${colsStr})\nVALUES (${valsStr});`);
      setCleanedData(payloadData);
      setStep(2);
    } finally {
      setIsValidating(false);
    }
  };

  // Final Insertion upon user approval in Step 2
  const handleApproveAndInsert = async () => {
    setIsInserting(true);
    try {
      const res = await insertRecord(table.name, cleanedData);
      if (res.success) {
        setInsertedRow(res.inserted_row);
        setStep(3);
        if (onRecordInserted) {
          onRecordInserted(res.inserted_row);
        }
      } else {
        addToast('Insertion Failed', res.error || 'Could not insert record.', 'error');
      }
    } catch (e) {
      addToast('Insert Error', e.message, 'error');
    } finally {
      setIsInserting(false);
    }
  };

  const getColumnIcon = (colType) => {
    const t = (colType || '').toUpperCase();
    if (t.includes('INT') || t.includes('SERIAL') || t.includes('NUMERIC') || t.includes('DECIMAL')) {
      return <Hash className="w-3.5 h-3.5 text-indigo-400" />;
    }
    if (t.includes('DATE') || t.includes('TIME')) {
      return <Calendar className="w-3.5 h-3.5 text-amber-400" />;
    }
    return <Type className="w-3.5 h-3.5 text-emerald-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-dark-900 border border-dark-700/90 rounded-2xl shadow-elevated flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-dark-800 bg-dark-850/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-dark-100">
                  Add Record to <span className="font-mono text-indigo-300">{table.name}</span>
                </h3>
              </div>
              <p className="text-xs text-dark-400 mt-0.5">
                {step === 1 && "Fill in values for the columns. All required cells will be verified before inserting."}
                {step === 2 && "Verification: review the data and SQL statement before giving approval."}
                {step === 3 && "Record appended successfully to live database."}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-dark-400 hover:text-dark-200 p-1.5 rounded-lg hover:bg-dark-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="px-6 py-2.5 bg-dark-950/40 border-b border-dark-800 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 ${step === 1 ? 'text-indigo-400 font-semibold' : 'text-dark-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 1 ? 'bg-indigo-600 text-white' : 'bg-dark-800 text-dark-400'}`}>
                1
              </span>
              <span>Enter Values & Validate</span>
            </div>

            <span className="text-dark-600">→</span>

            <div className={`flex items-center gap-1.5 ${step === 2 ? 'text-indigo-400 font-semibold' : 'text-dark-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 2 ? 'bg-indigo-600 text-white' : 'bg-dark-800 text-dark-400'}`}>
                2
              </span>
              <span>Verify & Approve</span>
            </div>
          </div>

          <div className="text-[11px] text-dark-400 font-mono hidden sm:block">
            Target: <span className="text-dark-200">{dbConfig.name}</span> ({dbConfig.type})
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* STEP 1: Form Inputs with Live Validation */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-dark-850/60 border border-dark-750 flex items-start gap-2.5 text-xs text-dark-300">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-dark-200">Constraint Validation Active:</span> Fields marked with <span className="text-rose-400 font-semibold font-mono">Required</span> must have a valid value. Auto-increment columns can be generated automatically.
                </div>
              </div>

              {errors._general && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errors._general}</span>
                </div>
              )}

              <div className="space-y-3.5">
                {(table.columns || []).map(col => {
                  const isAuto = autoGenFields[col.name];
                  const hasError = Boolean(errors[col.name]);
                  const isPrimaryKey = col.isPrimary;
                  const isRequired = !col.nullable && !isAuto && !col.defaultVal;

                  return (
                    <div 
                      key={col.name}
                      className={`p-3.5 rounded-xl border transition-all ${
                        hasError 
                          ? 'bg-rose-500/5 border-rose-500/40 ring-1 ring-rose-500/20' 
                          : 'bg-dark-850/40 border-dark-800/80 hover:border-dark-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          {getColumnIcon(col.type)}
                          <label className="text-xs font-semibold text-dark-100 font-mono">
                            {col.name}
                          </label>
                          <span className="text-[10px] text-dark-400 font-mono bg-dark-800 px-1.5 py-0.5 rounded border border-dark-700/60">
                            {col.type}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isPrimaryKey && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                              <Key className="w-3 h-3" />
                              PK
                            </span>
                          )}

                          {isRequired && (
                            <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">
                              Required
                            </span>
                          )}

                          {!isRequired && !isAuto && (
                            <span className="text-[10px] text-dark-400 bg-dark-800 px-1.5 py-0.5 rounded border border-dark-750">
                              Optional
                            </span>
                          )}

                          {isPrimaryKey && (
                            <label className="flex items-center gap-1.5 text-[11px] text-dark-300 cursor-pointer ml-1">
                              <input
                                type="checkbox"
                                checked={isAuto}
                                onChange={() => toggleAutoGen(col.name)}
                                className="w-3.5 h-3.5 rounded border-dark-700 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span>Auto-assign</span>
                            </label>
                          )}
                        </div>
                      </div>

                      {/* Input Box */}
                      {isAuto ? (
                        <div className="px-3 py-2 rounded-lg bg-dark-950/60 border border-dark-800 text-xs text-dark-500 font-mono italic flex items-center justify-between">
                          <span>[Auto Generated by Database Sequence]</span>
                          <span className="text-[10px] text-amber-400/80">DEFAULT / SERIAL</span>
                        </div>
                      ) : (
                        <div>
                          <input
                            type={
                              (col.type || '').toUpperCase().includes('INT')
                                ? 'number'
                                : (col.type || '').toUpperCase().includes('DATE')
                                ? 'date'
                                : 'text'
                            }
                            step={
                              (col.type || '').toUpperCase().includes('NUMERIC') || 
                              (col.type || '').toUpperCase().includes('DECIMAL') || 
                              (col.type || '').toUpperCase().includes('FLOAT') 
                                ? 'any' 
                                : undefined
                            }
                            value={formData[col.name] ?? ''}
                            onChange={(e) => handleInputChange(col.name, e.target.value)}
                            placeholder={
                              col.defaultVal 
                                ? `Default: ${col.defaultVal}` 
                                : isRequired 
                                ? `Enter ${col.name} (required)...` 
                                : `Enter ${col.name} (optional)...`
                            }
                            className={`w-full px-3 py-2 bg-dark-900 border rounded-lg text-xs text-dark-100 placeholder-dark-500 outline-none font-mono transition-colors ${
                              hasError 
                                ? 'border-rose-500 focus:border-rose-400' 
                                : 'border-dark-750 focus:border-indigo-500'
                            }`}
                          />
                        </div>
                      )}

                      {/* Error helper text */}
                      {hasError && (
                        <div className="flex items-center gap-1.5 text-[11px] text-rose-400 mt-1.5">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{errors[col.name]}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Review Added Data & User Approval */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 space-y-1">
                <div className="flex items-center gap-2 font-semibold text-indigo-200">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>Data Verified - Ready for Your Approval</span>
                </div>
                <p className="text-dark-300 leading-relaxed text-[11px]">
                  All required cells have been verified. Please inspect the values below and check the SQL query before giving your final approval to append this data into <span className="font-mono text-white">{table.name}</span>.
                </p>
              </div>

              {/* Data Verification Table */}
              <div className="rounded-xl border border-dark-800 bg-dark-950/60 overflow-hidden">
                <div className="px-4 py-2 bg-dark-850/80 border-b border-dark-800 flex items-center justify-between text-xs font-semibold text-dark-200">
                  <span>Column Verification Summary</span>
                  <span className="text-[11px] font-mono text-dark-400">{Object.keys(cleanedData).length} columns populated</span>
                </div>
                <div className="divide-y divide-dark-800/60 max-h-56 overflow-y-auto">
                  {(table.columns || []).map(col => {
                    const hasVal = cleanedData[col.name] !== undefined;
                    const val = cleanedData[col.name];
                    const isAuto = autoGenFields[col.name];

                    return (
                      <div key={col.name} className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-dark-850/30 font-mono">
                        <div className="flex items-center gap-2 min-w-0">
                          {getColumnIcon(col.type)}
                          <span className="font-medium text-dark-100">{col.name}</span>
                          <span className="text-[10px] text-dark-500">({col.type})</span>
                        </div>

                        <div className="flex items-center gap-2 text-right">
                          {isAuto ? (
                            <span className="text-[11px] text-amber-400 italic">
                              [Auto Generated Sequence]
                            </span>
                          ) : hasVal && val !== null ? (
                            <span className="text-emerald-400 font-semibold">
                              {typeof val === 'boolean' ? (val ? 'TRUE' : 'FALSE') : String(val)}
                            </span>
                          ) : (
                            <span className="text-dark-500 italic">NULL</span>
                          )}

                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Preview SQL Statement */}
              {previewSql && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-dark-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                      Generated SQL Statement
                    </span>
                    <span className="text-[10px] text-dark-500 font-mono">Read-safe execution</span>
                  </div>
                  <pre className="p-3.5 rounded-xl bg-dark-950 border border-dark-800 text-xs font-mono text-indigo-300 overflow-x-auto leading-relaxed shadow-inner">
                    {previewSql}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Success Confirmation */}
          {step === 3 && (
            <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-semibold text-white">Record Successfully Appended!</h4>
                <p className="text-xs text-dark-300 max-w-md mx-auto leading-relaxed">
                  The row has been safely committed to the <span className="font-mono text-indigo-300">{table.name}</span> table in your <span className="font-mono text-white">{dbConfig.name}</span> database.
                </p>
              </div>

              {insertedRow && (
                <div className="p-4 rounded-xl bg-dark-950 border border-dark-800 text-left max-w-lg mx-auto font-mono text-xs space-y-1.5">
                  <div className="text-[11px] font-semibold text-dark-400 uppercase tracking-wider mb-1">
                    Committed Row Data:
                  </div>
                  {Object.entries(insertedRow).map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-dark-850 py-1">
                      <span className="text-dark-400">{k}:</span>
                      <span className="text-emerald-400 font-medium">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-dark-800 bg-dark-850/60 flex items-center justify-between gap-3">
          {step === 1 && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-dark-800 hover:bg-dark-750 text-xs font-medium text-dark-300 hover:text-white transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleValidateAndProceed}
                disabled={isValidating}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying Data...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verify & Preview</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                  </>
                )}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isInserting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-dark-800 hover:bg-dark-750 text-xs font-medium text-dark-200 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Edit</span>
              </button>

              <button
                type="button"
                onClick={handleApproveAndInsert}
                disabled={isInserting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isInserting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Appending to Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Insert Record</span>
                  </>
                )}
              </button>
            </>
          )}

          {step === 3 && (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-all shadow-sm"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
