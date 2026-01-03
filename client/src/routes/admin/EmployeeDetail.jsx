const EmployeeDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('personal');
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';

  // Fetch employee data
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const data = await employeeService.getEmployeeById(id);
        setEmployee(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEmployee();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Not Found: </strong>
          <span className="block sm:inline">Employee not found</span>
        </div>
      </div>
    );
  }

  // Calculate age from date of birth
  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Document categories
  const documentCategories = [
    {
      id: 'identity',
      name: 'Identity Proof',
      icon: <UserCog className="h-4 w-4" />,
      documents: employee.documents?.filter(doc => doc.category === 'identity') || []
    },
    {
      id: 'education',
      name: 'Education',
      icon: <GraduationCap className="h-4 w-4" />,
      documents: employee.documents?.filter(doc => doc.category === 'education') || []
    },
    {
      id: 'experience',
      name: 'Experience',
      icon: <BriefcaseIcon className="h-4 w-4" />,
      documents: employee.documents?.filter(doc => doc.category === 'experience') || []
    },
    {
      id: 'other',
      name: 'Other Documents',
      icon: <File className="h-4 w-4" />,
      documents: employee.documents?.filter(doc => !['identity', 'education', 'experience'].includes(doc.category)) || []
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employee Details</h1>
          <p className="text-muted-foreground">View and manage employee information</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>

      {/* Employee Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={employee.personal?.profilePictureUrl} alt={employee.personal?.fullName} />
              <AvatarFallback>{getInitials(employee.personal?.fullName)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1 flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <h2 className="text-2xl font-semibold">{employee.personal?.fullName || 'No Name'}</h2>
                  <p className="text-muted-foreground">{employee.job?.title || 'No Title'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={employee.user?.isActive ? 'default' : 'destructive'}>
                    {employee.user?.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {employee.user?.role || 'employee'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-sm text-muted-foreground">
                {employee.user?.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4" />
                    {employee.user.email}
                  </span>
                )}
                {employee.personal?.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4" />
                    {employee.personal.phone}
                  </span>
                )}
                {employee.job?.department && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" />
                    {employee.job.department}
                  </span>
                )}
                {employee.job?.joinDate && (
                  <span className="flex items-center gap-1.5">
                    <CalendarIcon className="h-4 w-4" />
                    Joined {formatDate(employee.job.joinDate, 'MMM yyyy')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger
              value="personal"
              className="relative h-10 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-4 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <User className="mr-2 h-4 w-4" />
              Personal
            </TabsTrigger>
            <TabsTrigger
              value="job"
              className="relative h-10 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-4 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <BriefcaseIcon className="mr-2 h-4 w-4" />
              Job
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger
                value="salary"
                className="relative h-10 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-4 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Salary
              </TabsTrigger>
            )}
            <TabsTrigger
              value="documents"
              className="relative h-10 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-4 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <FileText className="mr-2 h-4 w-4" />
              Documents
            </TabsTrigger>
          </TabsList>

          <div className="p-6">
            {/* Personal Information Tab */}
            <TabsContent value="personal" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Personal Information</h3>
                  <p className="text-sm text-muted-foreground">Basic personal details</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Field label="Full Name" value={employee.personal?.fullName} icon={User} />
                  <Field 
                    label="Date of Birth" 
                    value={employee.personal?.dateOfBirth ? `${formatDate(employee.personal.dateOfBirth)} (${calculateAge(employee.personal.dateOfBirth)} years)` : null} 
                    icon={Cake} 
                  />
                  <Field label="Gender" value={employee.personal?.gender} icon={Users} />
                  <Field label="Marital Status" value={employee.personal?.maritalStatus} icon={Heart} />
                  <Field label="Blood Group" value={employee.personal?.bloodGroup} icon={Droplet} />
                  <Field label="Nationality" value={employee.personal?.nationality} icon={Globe} />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Contact Information</h3>
                  <p className="text-sm text-muted-foreground">Ways to get in touch</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Field label="Email" value={employee.user?.email} icon={Mail} />
                  <Field label="Phone" value={employee.personal?.phone} icon={Phone} />
                  <Field label="Alternate Phone" value={employee.personal?.alternatePhone} icon={PhoneCall} />
                  <Field 
                    label="Address" 
                    value={employee.personal?.address ? (
                      <div className="space-y-1">
                        <div>{employee.personal.address.line1}</div>
                        {employee.personal.address.line2 && <div>{employee.personal.address.line2}</div>}
                        <div>
                          {[employee.personal.address.city, employee.personal.address.state, employee.personal.address.country, employee.personal.address.postalCode]
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      </div>
                    ) : null} 
                    icon={MapPin} 
                    className="md:col-span-2 lg:col-span-3"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Emergency Contact</h3>
                  <p className="text-sm text-muted-foreground">Who to contact in case of emergency</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Field 
                    label="Emergency Contact Name" 
                    value={employee.personal?.emergencyContact?.name} 
                    icon={User} 
                  />
                  <Field 
                    label="Emergency Contact Relationship" 
                    value={employee.personal?.emergencyContact?.relationship} 
                    icon={Users} 
                  />
                  <Field 
                    label="Emergency Contact Phone" 
                    value={employee.personal?.emergencyContact?.phone} 
                    icon={Phone} 
                  />
                  <Field 
                    label="Emergency Contact Address" 
                    value={employee.personal?.emergencyContact?.address} 
                    icon={MapPin} 
                    className="md:col-span-2"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Job Information Tab */}
            <TabsContent value="job" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Employment Details</h3>
                  <p className="text-sm text-muted-foreground">Job and department information</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Field label="Employee ID" value={employee.user?.employeeId} icon={Hash} />
                  <Field label="Job Title" value={employee.job?.title} icon={BriefcaseIcon} />
                  <Field label="Department" value={employee.job?.department} icon={Building2} />
                  <Field label="Employment Type" value={employee.job?.employmentType} icon={FileText} />
                  <Field 
                    label="Joining Date" 
                    value={employee.job?.joinDate ? formatDate(employee.job.joinDate) : null} 
                    icon={CalendarIcon} 
                  />
                  <Field 
                    label="Probation End Date" 
                    value={employee.job?.probationEndDate ? formatDate(employee.job.probationEndDate) : 'N/A'} 
                    icon={CalendarIcon} 
                  />
                  <Field label="Manager" value={employee.job?.managerName} icon={UserCog} />
                  <Field label="Work Location" value={employee.job?.workLocation} icon={MapPin} />
                  <Field 
                    label="Work Email" 
                    value={employee.job?.workEmail || employee.user?.email} 
                    icon={Mail} 
                  />
                  <Field 
                    label="Work Phone" 
                    value={employee.job?.workPhone || employee.personal?.phone} 
                    icon={Phone} 
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Skills & Qualifications</h3>
                  <p className="text-sm text-muted-foreground">Employee's professional skills and certifications</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {employee.skills?.length > 0 ? (
                        employee.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="px-3 py-1">
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No skills added</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Certifications</h4>
                    {employee.certifications?.length > 0 ? (
                      <div className="space-y-2">
                        {employee.certifications.map((cert, index) => (
                          <div key={index} className="p-3 border rounded-md">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">{cert.name}</div>
                                <div className="text-sm text-muted-foreground">{cert.issuingOrganization}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {cert.issueDate && `Issued: ${formatDate(cert.issueDate)}`}
                                  {cert.expirationDate && ` • Expires: ${formatDate(cert.expirationDate)}`}
                                  {!cert.issueDate && !cert.expirationDate && cert.credentialId && `ID: ${cert.credentialId}`}
                                </div>
                              </div>
                              {cert.credentialUrl && (
                                <Button variant="ghost" size="icon" asChild>
                                  <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                    <span className="sr-only">View credential</span>
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No certifications added</p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Salary Information Tab (Admin Only) */}
            {isAdmin && (
              <TabsContent value="salary" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Salary Information</h3>
                    <p className="text-sm text-muted-foreground">Employee's compensation details</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <CurrencyField 
                      label="Basic Salary" 
                      value={employee.salary?.basic} 
                      icon={DollarSign} 
                    />
                    <CurrencyField 
                      label="House Rent Allowance (HRA)" 
                      value={employee.salary?.hra} 
                      icon={Home} 
                    />
                    <CurrencyField 
                      label="Dearness Allowance (DA)" 
                      value={employee.salary?.da} 
                      icon={DollarSign} 
                    />
                    <CurrencyField 
                      label="Special Allowance" 
                      value={employee.salary?.specialAllowance} 
                      icon={DollarSign} 
                    />
                    <CurrencyField 
                      label="Transport Allowance" 
                      value={employee.salary?.transportAllowance} 
                      icon={Car} 
                    />
                    <CurrencyField 
                      label="Medical Allowance" 
                      value={employee.salary?.medicalAllowance} 
                      icon={HeartPulse} 
                    />
                    <CurrencyField 
                      label="Provident Fund (PF)" 
                      value={employee.salary?.pf} 
                      icon={Wallet} 
                    />
                    <CurrencyField 
                      label="Professional Tax" 
                      value={employee.salary?.professionalTax} 
                      icon={Receipt} 
                    />
                    <CurrencyField 
                      label="Income Tax" 
                      value={employee.salary?.incomeTax} 
                      icon={Receipt} 
                    />
                    <div className="md:col-span-2 lg:col-span-3 border-t pt-4">
                      <div className="flex justify-between items-center">
                        <div className="font-medium">Total Earnings</div>
                        <div className="font-mono">
                          {formatMoney(
                            (employee.salary?.basic || 0) +
                            (employee.salary?.hra || 0) +
                            (employee.salary?.da || 0) +
                            (employee.salary?.specialAllowance || 0) +
                            (employee.salary?.transportAllowance || 0) +
                            (employee.salary?.medicalAllowance || 0)
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="font-medium">Total Deductions</div>
                        <div className="font-mono">
                          {formatMoney(
                            (employee.salary?.pf || 0) +
                            (employee.salary?.professionalTax || 0) +
                            (employee.salary?.incomeTax || 0)
                          )}
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="flex justify-between items-center font-semibold">
                        <div>Net Salary</div>
                        <div className="font-mono text-lg">
                          {formatMoney(
                            (employee.salary?.basic || 0) +
                            (employee.salary?.hra || 0) +
                            (employee.salary?.da || 0) +
                            (employee.salary?.specialAllowance || 0) +
                            (employee.salary?.transportAllowance || 0) +
                            (employee.salary?.medicalAllowance || 0) -
                            (employee.salary?.pf || 0) -
                            (employee.salary?.professionalTax || 0) -
                            (employee.salary?.incomeTax || 0)
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Bank Account Details</h3>
                    <p className="text-sm text-muted-foreground">For salary processing</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Field label="Account Holder Name" value={employee.bank?.accountHolderName} icon={User} />
                    <Field label="Bank Name" value={employee.bank?.bankName} icon={Banknote} />
                    <Field label="Account Number" value={employee.bank?.accountNumber} icon={CreditCard} />
                    <Field label="IFSC Code" value={employee.bank?.ifscCode} icon={FileDigit} />
                    <Field label="Branch" value={employee.bank?.branch} icon={MapPin} />
                    <Field label="Account Type" value={employee.bank?.accountType} icon={Wallet} />
                  </div>
                </div>
              </TabsContent>
            )}

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Employee Documents</h3>
                  <p className="text-sm text-muted-foreground">Important documents and certificates</p>
                </div>
                
                {documentCategories.map((category) => (
                  <div key={category.id} className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {category.icon}
                      <span>{category.name}</span>
                      <Badge variant="outline" className="ml-auto">
                        {category.documents.length} {category.documents.length === 1 ? 'item' : 'items'}
                      </Badge>
                    </div>
                    
                    {category.documents.length > 0 ? (
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {category.documents.map((doc) => (
                          <Card key={doc._id} className="overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                  {getDocumentIcon(doc.fileName || '')}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{doc.name || 'Document'}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {doc.fileName || 'No file name'}
                                  </p>
                                  {doc.uploadDate && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Uploaded {formatDate(doc.uploadDate, 'MMM d, yyyy')}
                                    </p>
                                  )}
                                </div>
                                <div className="flex-shrink-0">
                                  <Button variant="ghost" size="icon" asChild>
                                    <a 
                                      href={doc.fileUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-primary hover:text-primary/80"
                                    >
                                      <Download className="h-4 w-4" />
                                      <span className="sr-only">Download</span>
                                    </a>
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-sm text-muted-foreground bg-muted/30 rounded-md">
                        No {category.name.toLowerCase()} found.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
};

export default EmployeeDetail;