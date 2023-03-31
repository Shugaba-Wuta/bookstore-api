const BOOK_CATEGORY = require("./book category.json")

const NIGERIAN_COMMERCIAL_BANKS = require("./nigerianBanks.json")
const USER_FORBIDDEN_FIELDS = { "password": 0, "deleted": 0, "deletedOn": 0 }
const PRODUCT_FORBIDDEN_FIELDS = { "deleted": 0, "deletedOn": 0, "__v": 0, "commission": 0, "kind": 0 }
const PRODUCT_DEPARTMENTS = ["Books"]
const RESULT_LIMIT = 50
const OTP_CODE_LENGTH = 5
const TIME_TOLERANCE_FOR_OTP = 0.5 //Values from 0...1
const MAX_OTP_TIME_IN_SECONDS = 10 * 60 //time in secs
const DOCUMENT_CATEGORY_TYPES = ["others", "govtIssuedID", "pictures"]
const SUPER_ROLES = ["admin", "staff"]
const DEFAULT_COMMISSION = 15
const DEFAULT_TAX = 10
const ALLOWED_HOST = ["http://localhost:3000", "https://localhost:3000", "https://bookstore.com.ng", "https://www.bookstore.com.ng", "https://test.bookstore.com.ng", "https://catalogue-spc.netlify.app"]





module.exports = { BOOK_CATEGORY, NIGERIAN_COMMERCIAL_BANKS, USER_FORBIDDEN_FIELDS, PRODUCT_DEPARTMENTS, PRODUCT_FORBIDDEN_FIELDS, RESULT_LIMIT, OTP_CODE_LENGTH, MAX_OTP_TIME_IN_SECONDS, TIME_TOLERANCE_FOR_OTP, SUPER_ROLES, DEFAULT_COMMISSION, DEFAULT_TAX, DOCUMENT_CATEGORY_TYPES, ALLOWED_HOST }
