"use client";

import { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  User,
  Wallet,
  History,
  CheckCircle,
  AlertTriangle,
  Edit,
  IndianRupee,
  Euro,
  DollarSign,
  PoundSterling,
  Sun,
  Moon,
  Trash2,
  UserPlus,
  Loader2,
  Plus,
  Check
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from 'next-themes';
import { useEffect as useReactEffect } from 'react';
import { storage } from '../utils/storage'; // adjust the path as needed
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


// Component for displaying a participant item in the list
const ParticipantItem = ({ index, participant, isPayer, participantsLength, onDelete }: any) => (
  <li
    key={index}
    className={`flex justify-between items-center py-1 px-1 ${isPayer ? "bg-green-500/10 border border-green-500" : "bg-red-500/10"} 
    ${index === 0 ? "rounded-t-md" : ""} 
    ${index === participantsLength - 1 ? "rounded-b-md" : ""}`}
  >
    <div className="flex items-center space-x-2" >
      {
        isPayer ? (
          <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
        ) : (
          <User className="mr-1 h-4 w-4 text-foreground" />
        )}
      <span className={`${isPayer ? "text-green-500" : "text-red-500"}`}>
        {participant}
      </span>
    </div>

    {
      !isPayer && <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(participant)
        }
        className="text-red-500 hover:bg-red-500/10"
      >
        <Trash2 className="h-4 w-4" />
      </Button>}
  </li>


);


export default function Home() {
  const { theme: initialTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false); // Track if component has mounted
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<{ [sessionId: string]: any }>({});


  // Wait for the component to mount before accessing the theme to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Safely access the theme after the component has mounted
  const theme = mounted ? initialTheme : "light";

  const [billAmount, setBillAmount] = useState<number | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [participantName, setParticipantName] = useState("");
  const [owedAmounts, setOwedAmounts] = useState<{ [name: string]: number }>({});
  const [individualOwedAmounts, setIndividualOwedAmounts] = useState<{ [payer: string]: { [owee: string]: number } }>({});

  const [payer, setPayer] = useState<string>("");
  const [currency, setCurrency] = useState<string>("INR");
  const [isCalculating, setIsCalculating] = useState(false);
  const [expenseType, setExpenseType] = useState<string>("Food/Meal"); // Default expense type
  const [expenseTypes, setExpenseTypes] = useState<string[]>(["Food/Meal", "Shopping", "Travel"]); // Initial expense types
  // const [expenses, setExpenses] = useState<any[]>([]);
  const [isEditingExpenseType, setIsEditingExpenseType] = useState(false);
  const [newExpenseType, setNewExpenseType] = useState("");
  const [activeTab, setActiveTab] = useState("expenseDetails");

  // Error states
  const [billAmountError, setBillAmountError] = useState<string | null>(null);
  const [participantNameError, setParticipantNameError] = useState<string | null>(null);
  const [participantsError, setParticipantsError] = useState<string | null>(null);
  const [payerError, setPayerError] = useState<string | null>(null);
  const [currencyError, setCurrencyError] = useState<string | null>(null);

  const currencySymbols: any = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    JPY: "¥",
    CAD: "C$",
    AUD: "A$",
  };

  // Function to initialize a new session
  const initializeSession = (sessionId: string) => {
    setSessions(prevSessions => ({
      ...prevSessions,
      [sessionId]: {
        sessionId: sessionId,
        participants: [],
        expenses: [],
        createdAt: new Date().toISOString() // Add creation date
      },
    }));
  };

  // Load sessions from storage on component mount
  // Load sessions from storage on component mount
  useEffect(() => {
    const loadSessions = async () => {
      const storedData = await storage.get('splitzyData');
      if (storedData) {
        const parsedData = JSON.parse(JSON.stringify(storedData));
        // Ensure old sessions without createdAt get a default date
        const sessionsWithDates = Object.entries(parsedData.sessions || {}).reduce(
          (acc, [id, session]) => ({
            ...acc,
            [id]: {
              ...session,
              createdAt: session.createdAt || new Date().toISOString()
            }
          }),
          {}
        );
        setSessions(sessionsWithDates);
        setActiveSessionId(parsedData.activeSessionId || null);
      } else {
        const newSessionId = uuidv4();
        initializeSession(newSessionId);
        setActiveSessionId(newSessionId);
      }
    };

    loadSessions();
  }, []);

  // Save sessions to storage whenever the sessions state changes
  useEffect(() => {
    const saveData = async () => {
      if (activeSessionId) {
        const data = {
          sessions: sessions,
          activeSessionId: activeSessionId
        };
        await storage.set('splitzyData', data);
      }
    };

    saveData();
  }, [sessions, activeSessionId]);


  useEffect(() => {
    if (activeSessionId && !sessions[activeSessionId]) {
      initializeSession(activeSessionId);
    }
  }, [activeSessionId, sessions]);

  // Update participants and expenses based on the active session
  useEffect(() => {
    if (activeSessionId && sessions[activeSessionId]) {
      setParticipants(sessions[activeSessionId].participants || []);
    } else {
      setParticipants([]);
    }
  }, [activeSessionId, sessions]);


  // Load expenses from storage on component mount
  // useEffect(() => {
  //   const loadExpenses = async () => {
  //     const storedExpenses = await storage.get('expenses');
  //     if (storedExpenses) {
  //       setExpenses(storedExpenses as any[]);
  //       // Extract participants from stored expenses
  //       const allParticipants = new Set<string>();
  //       storedExpenses.forEach((expense: any) => {
  //         expense.participants.forEach((participant: string) => {
  //           allParticipants.add(participant);
  //         });
  //       });
  //       setParticipants(Array.from(allParticipants));
  //     }
  //   };

  //   loadExpenses();
  // }, []);

  // Save expenses to storage whenever the expenses state changes
  // useEffect(() => {
  //   storage.set('expenses', expenses);
  // }, [expenses]);


  // Validation function to check if the form is valid
  const isFormValid = () => {
    let isValid = true;

    // Participants Validation
    if (participants.length === 0) {
      setParticipantsError("Please add at least one participant.");
      isValid = false;
    } else {
      setParticipantsError(null);
    }
    if (!payer) {
      setPayerError("Please select payer.")
      isValid = false;
    } else {
      setPayerError(null);
    }

    if (!currency) {
      setCurrencyError("Please select currency.")
      isValid = false;
    } else {
      setPayerError(null);
    }

    return isValid;
  };

  // Helper function to format session ID for display
  const formatSessionId = (id) => {
    const date = new Date(id.split('-').slice(0, 3).join('-'));
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };


  // Handler for adding a new participant to the list
  const handleAddParticipant = () => {
    if (participantName.trim() === "") {
      setParticipantNameError("Participant name cannot be empty.");
      return;
    } else {
      setParticipantNameError(null);
    }

    // setParticipants([...participants, participantName.trim()]);

    if (activeSessionId && sessions[activeSessionId]) {
      setSessions(prevSessions => {
        const updatedParticipants = [...(prevSessions[activeSessionId].participants || []), participantName.trim()];
        return {
          ...prevSessions,
          [activeSessionId]: {
            ...prevSessions[activeSessionId],
            participants: updatedParticipants,
          },
        };
      });
      setParticipantName("");
    }
  };

  const handleDeleteParticipant = (participantToDelete: string) => {
    if (activeSessionId && sessions[activeSessionId]) {
      setSessions(prevSessions => {
        const updatedParticipants = prevSessions[activeSessionId].participants.filter((participant: string) => participant !== participantToDelete);
        return {
          ...prevSessions,
          [activeSessionId]: {
            ...prevSessions[activeSessionId],
            participants: updatedParticipants,
          },
        };
      });
    }
  };

  // Handler for calculating the split amount
  const handleCalculateSplit = () => {
    // Reset error states
    setBillAmountError(null);
    setParticipantsError(null);
    setPayerError(null);
    setCurrencyError(null);

    let isValid = true;

    // Validate bill amount
    if (billAmount === null || billAmount <= 0) {
      setBillAmountError("Bill amount must be greater than 0.");
      isValid = false;
    }

    // Validate form fields
    if (!isFormValid()) {
      return;
    }

    // If form is invalid, return
    if (!isValid) {
      return;
    }

    setIsCalculating(true);
    try {
      // Calculate split amount
      const splitAmount = billAmount! / participants.length;
      const newOwedAmounts: { [name: string]: number } = {};
      const newIndividualOwedAmounts: { [payer: string]: { [owee: string]: number } } = {};

      // Calculate owed amounts for each participant
      participants.forEach((participant) => {
        if (payer === participant) {
          newOwedAmounts[participant] = 0; // Payer already paid
        } else {
          newOwedAmounts[participant] = splitAmount;
          if (!newIndividualOwedAmounts[payer]) {
            newIndividualOwedAmounts[payer] = {};
          }
          newIndividualOwedAmounts[payer][participant] = splitAmount;
        }
      });

      // Update owed amounts state
      setOwedAmounts(newOwedAmounts);
      // Consolidate individual owed amounts
      setIndividualOwedAmounts(prevIndividualOwedAmounts => {
        const updatedIndividualOwedAmounts = { ...prevIndividualOwedAmounts };

        if (!updatedIndividualOwedAmounts[payer]) {
          updatedIndividualOwedAmounts[payer] = {};
        }

        participants.forEach(participant => {
          if (payer !== participant) {
            updatedIndividualOwedAmounts[payer][participant] = splitAmount;
          }
        });

        return updatedIndividualOwedAmounts;
      });
      if (activeSessionId && sessions[activeSessionId]) {
        setSessions(prevSessions => {
          const updatedExpenses = [{
            type: expenseType,
            amount: billAmount,
            participants: participants,
            payer: payer,
            currency: currency,
            owedAmounts: newOwedAmounts,
          }, ...(prevSessions[activeSessionId].expenses || []),];
          return {
            ...prevSessions,
            [activeSessionId]: {
              ...prevSessions[activeSessionId],
              expenses: updatedExpenses,
            },
          };
        });
      }
    } finally {
      setIsCalculating(false);
    }
  };

  // Check if calculation is disabled
  const isCalculateDisabled = !billAmount || !payer || !currency;



  const handleAddExpenseType = () => {
    setIsEditingExpenseType(true);
  };

  const handleSaveExpenseType = () => {
    if (newExpenseType && newExpenseType.trim() !== "" && !expenseTypes.includes(newExpenseType.trim())) {
      setExpenseTypes(prevTypes => [...new Set([...prevTypes, newExpenseType.trim()])]);
    }
    setIsEditingExpenseType(false);
    setNewExpenseType("");
  };

  const handleDeleteExpense = async (indexToDelete: number) => {
    if (activeSessionId && sessions[activeSessionId]) {
      setSessions(prevSessions => {
        const updatedExpenses = prevSessions[activeSessionId].expenses.filter((_, index) => index !== indexToDelete);
        return {
          ...prevSessions,
          [activeSessionId]: {
            ...prevSessions[activeSessionId],
            expenses: updatedExpenses,
          },
        };
      });
    }
  };


  const totalOwedAmounts = () => {
    let totalOwed: { [name: string]: number } = {};
    if (activeSessionId && sessions[activeSessionId]) {
      (sessions[activeSessionId].expenses || []).forEach(expense => {
        Object.entries(expense.owedAmounts).forEach(([name, amount]) => {
          totalOwed[name] = (totalOwed[name] || 0) + amount;
        });
      });
    }
    return totalOwed;
  }

  const calculateNetOwedAmounts = () => {
    let netOwed: { [name: string]: number } = {};

    if (activeSessionId && sessions[activeSessionId]) {
      (sessions[activeSessionId].expenses || []).forEach(expense => {
        Object.entries(expense.owedAmounts).forEach(([owee, amount]) => {
          if (!netOwed[owee]) {
            netOwed[owee] = 0;
          }
          netOwed[owee] += amount; // Owee receives
          if (!netOwed[expense.payer]) {
            netOwed[expense.payer] = 0;
          }
          netOwed[expense.payer] -= amount; // Payer pays
        });
      });
    }
    return netOwed;
  };

  const calculateSimplifiedOwedAmounts = () => {
    const netOwed = calculateNetOwedAmounts();
    const simplifiedOwed: { from: string; to: string; amount: number; currency: string }[] = [];

    const sortedParticipants = Object.entries(netOwed)
      .sort(([, amountA], [, amountB]) => amountB - amountA)
      .map(([name]) => name);

    let balances = { ...netOwed };
    let transactionCurrency = "USD";
    for (let i = 0; i < sortedParticipants.length; i++) {
      const creditor = sortedParticipants[i];
      if (balances[creditor] <= 0) continue;

      for (let j = i + 1; j < sortedParticipants.length; j++) {
        const debtor = sortedParticipants[j];
        if (balances[debtor] >= 0) continue;

        const transactionAmount = Math.min(balances[creditor], -balances[debtor]);
        const relevantExpense = (sessions[activeSessionId]?.expenses || []).find(expense =>
          expense.owedAmounts[debtor] != null && expense.owedAmounts[creditor] != null
        );
        // Default to USD if no currency is found
        // const transactionCurrency = relevantExpense ? relevantExpense.currency : "USD"; 

        transactionCurrency = relevantExpense?.currency || transactionCurrency;

        simplifiedOwed.push({
          from: debtor,
          to: creditor,
          amount: transactionAmount,
          currency: transactionCurrency,
        });

        balances[creditor] -= transactionAmount;
        balances[debtor] += transactionAmount;

        if (balances[creditor] === 0) break;
      }
    }

    return simplifiedOwed;
  };




  return (
    <div>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-green-50 to-teal-100 dark:from-gray-900 dark:to-gray-800" >
        <div className="container mx-auto px-4 py-8 flex-1" >
          <Card className="max-w-3xl mx-auto shadow-lg" >
            <CardHeader className="relative" >
              <div className="flex flex-col gap-4">
                {/* First row - App name and theme toggle */}
                <div className="flex justify-between items-start">
                  <CardHeader className="p-0">
                    <CardTitle className="text-2xl md:text-3xl font-bold text-foreground">
                      Splitzy
                    </CardTitle>
                    <CardDescription className="text-foreground/70 text-sm md:text-base">
                      Split expenses with friends
                    </CardDescription>
                  </CardHeader>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                    className="rounded-full"
                  >
                    {theme === 'light' ? (
                      <Moon className="h-4 w-4 md:h-5 md:w-5" />
                    ) : (
                      <Sun className="h-4 w-4 md:h-5 md:w-5" />
                    )}
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </div>

                {/* Second row - Session controls */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full sm:w-auto">
                        <History className="mr-2 h-4 w-4" />
                        <span className="truncate">
                          {activeSessionId
                            ? new Date(sessions[activeSessionId]?.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })
                            : "Sessions"}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full sm:w-56">
                      <DropdownMenuLabel>Your Sessions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {Object.values(sessions).map((session) => {
                        const sessionDate = new Date(session.createdAt);
                        const formattedDate = sessionDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        });

                        return (
                          <DropdownMenuItem
                            key={session.sessionId}
                            onClick={() => setActiveSessionId(session.sessionId)}
                            className={activeSessionId === session.sessionId ? "bg-accent" : ""}
                          >
                            <div className="flex flex-col w-full">
                              <span className="font-medium">{formattedDate}</span>
                              <span className="text-xs text-muted-foreground">
                                {session.expenses.length} expense(s) • {session.participants.length} participant(s)
                              </span>
                            </div>
                            {activeSessionId === session.sessionId && (
                              <Check className="ml-auto h-4 w-4" />
                            )}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    variant="outline"
                    onClick={() => {
                      const newSessionId = uuidv4();
                      initializeSession(newSessionId);
                      setActiveSessionId(newSessionId);
                    }}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Session
                  </Button>
                </div>
              </div>
            </CardHeader>

            < CardContent >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" >
                <TabsList className="grid grid-cols-2 w-full mb-6" >
                  <TabsTrigger value="expenseDetails" > Expense Details </TabsTrigger>
                  < TabsTrigger value="owedBreakdown" > Owed Breakdown </TabsTrigger>
                </TabsList>

                < TabsContent value="expenseDetails" className="space-y-6" >
                  <div className="grid gap-6 md:grid-cols-2" >
                    {/* Expense Type Section */}
                    < div className="space-y-2" >
                      <Label className="font-medium" > Expense Type </Label>
                      < div className="flex gap-2" >
                        <Select onValueChange={setExpenseType} value={expenseType} >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {
                              expenseTypes.map((type) => (
                                <SelectItem key={type} value={type} > {type} </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                        < Button
                          variant="outline"
                          size="icon"
                          onClick={handleAddExpenseType}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      {
                        isEditingExpenseType && (
                          <div className="space-y-2" >
                            <Input
                              placeholder="New expense type"
                              value={newExpenseType}
                              onChange={(e) => setNewExpenseType(e.target.value)
                              }
                            />
                            < Button onClick={handleSaveExpenseType} className="w-full" >
                              Save
                            </Button>
                          </div>
                        )}
                    </div>

                    {/* Bill Amount Section */}
                    <div className="space-y-2" >
                      <Label className="font-medium" > Bill Amount </Label>
                      < div className="flex" >
                        <Select onValueChange={setCurrency} value={currency} >
                          <SelectTrigger className="w-[90px] rounded-r-none" >
                            <span>{currencySymbols[currency]} </span>
                          </SelectTrigger>
                          <SelectContent>
                            {
                              Object.entries(currencySymbols).map(([code, symbol]) => (
                                <SelectItem key={code} value={code} >
                                  {code} - {symbol}
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                        < Input
                          type="number"
                          placeholder="Amount"
                          className="rounded-l-none"
                          value={billAmount === null ? "" : billAmount.toString()}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            setBillAmount(isNaN(value) ? null : value);
                          }}
                        />
                      </div>
                      {
                        billAmountError && (
                          <Alert variant="destructive" className="mt-2" >
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{billAmountError} </AlertDescription>
                          </Alert>
                        )
                      }
                    </div>

                    {/* Participants Section */}
                    <div className="space-y-2" >
                      <Label className="font-medium" > Participants </Label>
                      < div className="flex gap-2" >
                        <Input
                          placeholder="Add participant"
                          value={participantName}
                          onChange={(e) => setParticipantName(e.target.value)}
                        />
                        < Button onClick={handleAddParticipant} >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add
                        </Button>
                      </div>
                      {
                        participantNameError && (
                          <Alert variant="destructive" className="mt-2" >
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{participantNameError} </AlertDescription>
                          </Alert>
                        )
                      }
                    </div>

                    {/* Payer Section */}
                    <div className="space-y-2" >
                      <Label className="font-medium" > Who Paid ? </Label>
                      < Select onValueChange={setPayer} value={payer} >
                        <SelectTrigger>
                          <SelectValue placeholder="Select payer" />
                        </SelectTrigger>
                        <SelectContent>
                          {
                            participants.map((participant) => (
                              <SelectItem key={participant} value={participant} >
                                {participant}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                      {
                        payerError && (
                          <Alert variant="destructive" className="mt-2" >
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{payerError} </AlertDescription>
                          </Alert>
                        )
                      }
                    </div>
                  </div>

                  {/* Participants List */}
                  {
                    participants.length > 0 && (
                      <div className="space-y-2" >
                        <Label className="font-medium" > Participants List </Label>
                        < ul className="border rounded-lg" >
                          {
                            participants.map((participant, index) => (
                              <ParticipantItem
                                key={index}
                                index={index}
                                participant={participant}
                                isPayer={payer === participant}
                                participantsLength={participants.length}
                                onDelete={handleDeleteParticipant}
                              />
                            ))
                          }
                        </ul>
                      </div>
                    )}

                  {/* Calculate Button */}
                  <Button
                    className="w-full py-6 text-lg mt-4"
                    onClick={handleCalculateSplit}
                    disabled={isCalculating || isCalculateDisabled}
                  >
                    {
                      isCalculating ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <Wallet className="mr-2 h-5 w-5" />
                      )}
                    Calculate Split
                  </Button>

                  {/* Expenses List */}
                  <div className="space-y-4 mt-6" >
                    <h3 className="text-lg font-semibold" > Recent Expenses </h3>

                    {(sessions[activeSessionId]?.expenses || []).map((expense, index) => (
                      <Card key={index} className="mb-4 hover:shadow-md transition-shadow" >
                        <CardHeader className="flex flex-row justify-between items-center p-4" >
                          <div>
                            <CardTitle>{expense.type} </CardTitle>
                            < CardContent className="text-sm text-muted-foreground p-0" >
                              Paid by {expense.payer}
                            </CardContent>
                          </div>
                          < Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteExpense(index)}
                            className="text-red-500 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </CardHeader>
                        < CardContent className="p-4 pt-0" >
                          <div className="space-y-2" >
                            <div className="flex justify-between" >
                              <span className="text-muted-foreground" > Total: </span>
                              < span className="font-bold" >
                                {currencySymbols[expense.currency] || "$"}{expense.amount.toFixed(2)}
                              </span>
                            </div>

                            < div className="border-t pt-3" >
                              <h4 className="text-sm font-medium mb-2" > Owed amounts: </h4>
                              < ul className="space-y-2" >
                                {
                                  Object.entries(expense.owedAmounts).map(([name, amount]) => (
                                    <li key={name} className="flex justify-between text-sm" >
                                      <span className="flex items-center gap-1" >
                                        {
                                          expense.payer === name ? (
                                            <CheckCircle className="h-3 w-3 text-green-500" />
                                          ) : (
                                            <User className="h-3 w-3" />
                                          )}
                                        {name}
                                      </span>
                                      <span>
                                        {currencySymbols[expense.currency] || "$"} {amount.toFixed(2)}
                                      </span>
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                < TabsContent value="owedBreakdown" className="space-y-6" >
                  <div className="space-y-6" >
                    {/* Simplified Transactions */}
                    < Card >
                      <CardHeader>
                        <CardTitle>Simplified Transactions </CardTitle>
                        < CardDescription className="text-foreground/70" >
                          Who needs to pay whom
                        </CardDescription>
                      </CardHeader>
                      < CardContent >
                        <ul className="space-y-2" >
                          {
                            calculateSimplifiedOwedAmounts().map((transaction, i) => (
                              <li key={i} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg" >
                                <span>
                                  <span className="font-medium" > {transaction.to} </span> owes{' '}
                                  < span className="font-medium" > {transaction.from} </span>
                                </span>
                                < span className="font-bold" >
                                  {currencySymbols[transaction.currency] || "$"}{transaction.amount.toFixed(2)}
                                </span>
                              </li>
                            ))
                          }
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Total Balances */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Total Balances </CardTitle>
                      </CardHeader>
                      < CardContent >
                        <ul className="space-y-2" >
                          {
                            Object.entries(totalOwedAmounts()).map(([name, amount]) => {
                              const currency = (sessions[activeSessionId]?.expenses || []).find(e => name in e.owedAmounts)?.currency || "USD";
                              return (
                                <li
                                  key={name}
                                  className={`flex justify-between items-center p-3 rounded-lg ${amount < 0 ? 'bg-red-500/10' : 'bg-green-500/10'
                                    }`
                                  }
                                >
                                  <span className="flex items-center gap-2" >
                                    <User className="h-4 w-4" />
                                    <span className="font-medium" > {name} </span>
                                  </span>
                                  < span className={`font-bold ${amount < 0 ? 'text-red-500' : 'text-green-500'
                                    }`} >
                                    {amount < 0 ? '-' : '+'}
                                    {currencySymbols[currency] || "$"} {Math.abs(amount).toFixed(2)}
                                  </span>
                                </li>
                              );
                            })}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        < footer className="py-4 text-center text-sm text-muted-foreground" >
          Made with ❤️ just for you
        </footer>
      </div>
    </div>
  );
}