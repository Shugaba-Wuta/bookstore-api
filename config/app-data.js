const bookCategory = [
    'Arts & Photography',
    'Biographies & Memoirs',
    'Business & Money',
    'Calendars',
    "Children's Books",
    'Christian Books & Bibles',
    'Comics & Graphic Novels',
    'Computers & IT',
    'Cookbooks, Food & Wine',
    'Crafts & Hobbies',
    'Crime & Thriller',
    'Dictionaries & Languages',
    'Education & Teaching',
    'Health, Fitness & Dieting',
    'History & Archaeology',
    'Home & Garden',
    'Humor & Entertainment',
    'LGBTQ Books',
    'Law',
    'Literature & Fiction',
    'Medical Books',
    'Mind, Body & Spirit',
    'Mystery & Suspense',
    'Parenting & Relationships',
    'Personal Development',
    'Poetry & Drama',
    'Politics, Society & Social Sciences',
    'Reference',
    'Religion & Spirituality',
    'Romance',
    'Science & Math',
    'Science Fiction, Fantasy & Horror',
    'Sports & Outdoors',
    'Technology & Engineering',
    'Teen & Young Adult',
    'Test Preparation',
    'Transport',
    'Travel & Holiday Guides'
]




const nigerianCommercialBanks = [
    { id: "1", name: "Access Bank", code: "044" },
    { id: "2", name: "Citibank", code: "023" },
    { id: "3", name: "Diamond Bank", code: "063" },
    { id: "4", name: "Dynamic Standard Bank", code: "" },
    { id: "5", name: "Ecobank Nigeria", code: "050" },
    { id: "6", name: "Fidelity Bank Nigeria", code: "070" },
    { id: "7", name: "First Bank of Nigeria", code: "011" },
    { id: "8", name: "First City Monument Bank", code: "214" },
    { id: "9", name: "Guaranty Trust Bank", code: "058" },
    { id: "10", name: "Heritage Bank Plc", code: "030" },
    { id: "11", name: "Jaiz Bank", code: "301" },
    { id: "12", name: "Keystone Bank Limited", code: "082" },
    { id: "13", name: "Providus Bank Plc", code: "101" },
    { id: "14", name: "Polaris Bank", code: "076" },
    { id: "15", name: "Stanbic IBTC Bank Nigeria Limited", code: "221" },
    { id: "16", name: "Standard Chartered Bank", code: "068" },
    { id: "17", name: "Sterling Bank", code: "232" },
    { id: "18", name: "Suntrust Bank Nigeria Limited", code: "100" },
    { id: "19", name: "Union Bank of Nigeria", code: "032" },
    { id: "20", name: "United Bank for Africa", code: "033" },
    { id: "21", name: "Unity Bank Plc", code: "215" },
    { id: "22", name: "Wema Bank", code: "035" },
    { id: "23", name: "Zenith Bank", code: "057" },
]

const USER_FORBIDDEN_FIELDS = { "password": 0, "deleted": 0, "deletedOn": 0 }
const PRODUCT_FORBIDDEN_FIELDS = { "deleted": 0, "deletedOn": 0, "__v": 0, "commission": 0, "kind": 0 }

const PRODUCT_DEPARTMENTS = ["Books"]
const RESULT_LIMIT = 50
const OTP_CODE_LENGTH = 5
const MAX_OTP_TIME_IN_SECONDS = 10 * 60 //time in secs
const TIME_TOLERANCE_FOR_OTP = 0.5 //Values from 0...1

const DEFAULT_USER_PERMISSION = ["user:read", "user:write", "purchase", "book:read", "book:review", "seller:read:basic"]
const DEFAULT_SELLER_PERMISSION = ["seller:read", "seller:write", "purchase", "user:read", "book:read", "book:write", "book:review", "coupon:write", "coupon:read", "ticket:read", "ticket:write"]


const SUPER_ROLES = ["admin", "staff"]
const DEFAULT_COMMISSION = 15
const DEFAULT_TAX = 10







module.exports = { bookCategory, nigerianCommercialBanks, USER_FORBIDDEN_FIELDS, PRODUCT_DEPARTMENTS, PRODUCT_FORBIDDEN_FIELDS, RESULT_LIMIT, OTP_CODE_LENGTH, MAX_OTP_TIME_IN_SECONDS, TIME_TOLERANCE_FOR_OTP, DEFAULT_USER_PERMISSION, DEFAULT_SELLER_PERMISSION, SUPER_ROLES, DEFAULT_COMMISSION, DEFAULT_TAX }
