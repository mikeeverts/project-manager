import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TEST_SUITES, TEST_IDS, buildTestData } from '../tests/suites';

function StatusIcon({ status }) {
  if (status === 'pass') {
    return (
      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (status === 'fail') {
    return (
      <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  }
  // pending / running
  return (
    <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
  );
}

function SuiteCard({ suite, results, running }) {
  const [expanded, setExpanded] = useState(true);

  const done = results.length > 0;
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const total = results.length;

  let headerColor = 'border-slate-200 bg-white';
  if (done && failed === 0) headerColor = 'border-green-200 bg-green-50';
  if (done && failed > 0)   headerColor = 'border-red-200 bg-red-50';
  if (running)               headerColor = 'border-indigo-200 bg-indigo-50';

  return (
    <div className={`rounded-xl border shadow-sm overflow-hidden ${headerColor}`}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left"
      >
        {running ? (
          <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin flex-shrink-0" />
        ) : done && failed === 0 ? (
          <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : done && failed > 0 ? (
          <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ) : (
          <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
        )}

        <span className="font-medium text-sm text-slate-800 flex-1">{suite.label}</span>

        {done && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            failed === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {passed}/{total}
          </span>
        )}

        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && results.length > 0 && (
        <div className="border-t border-slate-100 bg-white divide-y divide-slate-50">
          {results.map((r, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-2.5">
              <StatusIcon status={r.status} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">{r.name}</p>
                {r.error && (
                  <p className="text-xs text-red-500 mt-0.5 font-mono break-all">{r.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TestRunner({ onBack }) {
  const { rawState, dispatch } = useApp();
  const [suiteResults, setSuiteResults] = useState({});
  const [runningSuite, setRunningSuite] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [cleanupDone, setCleanupDone] = useState(false);

  // Check if test data is already present
  const testDataPresent = rawState.companies.some(c => c.id === TEST_IDS.companyA);

  function cleanupTestData() {
    // Remove test tasks first (cascading via projects would remove them, but let's be explicit)
    Object.values(TEST_IDS).filter(id => id.startsWith('test-task-')).forEach(id => {
      dispatch({ type: 'DELETE_TASK', payload: id });
    });
    // Delete test projects (also removes tasks via reducer)
    [TEST_IDS.projectA, TEST_IDS.projectB].forEach(id => {
      dispatch({ type: 'DELETE_PROJECT', payload: id });
    });
    // Delete test departments
    [TEST_IDS.deptA, TEST_IDS.deptB].forEach(id => {
      dispatch({ type: 'DELETE_DEPARTMENT', payload: id });
    });
    // Delete test companies (also removes members/projects via reducer)
    [TEST_IDS.companyA, TEST_IDS.companyB].forEach(id => {
      dispatch({ type: 'DELETE_COMPANY', payload: id });
    });
    setSuiteResults({});
    setCleanupDone(true);
  }

  async function runAllTests() {
    setIsRunning(true);
    setSuiteResults({});
    setCleanupDone(false);

    // Build a synthetic state that merges rawState with test data so tests
    // always run against a consistent, known dataset regardless of existing state.
    const { companies, teamMembers, departments, projects, tasks } = buildTestData();

    // Inject test data if not already present
    if (!testDataPresent) {
      companies.forEach(c => dispatch({ type: 'ADD_COMPANY', payload: c }));
      teamMembers.forEach(m => dispatch({ type: 'ADD_MEMBER', payload: m }));
      departments.forEach(d => dispatch({ type: 'ADD_DEPARTMENT', payload: d }));
      projects.forEach(p => dispatch({ type: 'ADD_PROJECT', payload: p }));
      tasks.forEach(t => dispatch({ type: 'ADD_TASK', payload: t }));
    }

    // Build a synthetic test state from the known test data (not rawState, which may not have updated yet)
    const testState = {
      companies: [...rawState.companies.filter(c => !companies.some(tc => tc.id === c.id)), ...companies],
      teamMembers: [...rawState.teamMembers.filter(m => !teamMembers.some(tm => tm.id === m.id)), ...teamMembers],
      departments: [...rawState.departments.filter(d => !departments.some(td => td.id === d.id)), ...departments],
      projects: [...rawState.projects.filter(p => !projects.some(tp => tp.id === p.id)), ...projects],
      tasks: [...rawState.tasks.filter(t => !tasks.some(tt => tt.id === t.id)), ...tasks],
    };

    for (const suite of TEST_SUITES) {
      setRunningSuite(suite.id);
      await new Promise(r => setTimeout(r, 150)); // visual feedback delay
      try {
        const results = suite.runner(testState);
        setSuiteResults(prev => ({ ...prev, [suite.id]: results }));
      } catch (e) {
        setSuiteResults(prev => ({
          ...prev,
          [suite.id]: [{ name: 'Suite error', status: 'fail', error: String(e) }],
        }));
      }
    }

    setRunningSuite(null);
    setIsRunning(false);
  }

  const allResults = Object.values(suiteResults).flat();
  const totalPass = allResults.filter(r => r.status === 'pass').length;
  const totalFail = allResults.filter(r => r.status === 'fail').length;
  const totalTests = allResults.length;
  const allDone = !isRunning && totalTests > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-800">Test Runner</h1>
            <p className="text-xs text-slate-400">Multi-company isolation & permission tests</p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          Back to Admin Panel
        </button>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Controls */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Test Data</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {testDataPresent
                  ? 'Test companies & data are present in state.'
                  : 'No test data found — will be created when you run tests.'}
              </p>
              {cleanupDone && (
                <p className="text-xs text-green-600 mt-0.5 font-medium">All test data removed.</p>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {testDataPresent && (
                <button
                  onClick={cleanupTestData}
                  disabled={isRunning}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clean Up Test Data
                </button>
              )}
              <button
                onClick={runAllTests}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                {isRunning ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Running…
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Run All Tests
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Summary bar */}
          {allDone && (
            <div className={`mt-4 p-3 rounded-lg flex items-center gap-3 ${
              totalFail === 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              {totalFail === 0 ? (
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <div className="flex-1">
                <p className={`text-sm font-semibold ${totalFail === 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {totalFail === 0 ? 'All tests passed!' : `${totalFail} test${totalFail > 1 ? 's' : ''} failed`}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {totalPass} passed · {totalFail} failed · {totalTests} total across {TEST_SUITES.length} suites
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Suite cards */}
        <div className="space-y-3">
          {TEST_SUITES.map(suite => (
            <SuiteCard
              key={suite.id}
              suite={suite}
              results={suiteResults[suite.id] || []}
              running={runningSuite === suite.id}
            />
          ))}
        </div>

        {/* Test data note */}
        <p className="text-xs text-slate-400 text-center pb-4">
          Test data uses IDs prefixed with <code className="font-mono">test-</code> and names prefixed with <code className="font-mono">__</code> for easy identification. Use "Clean Up Test Data" to remove it.
        </p>
      </div>
    </div>
  );
}
