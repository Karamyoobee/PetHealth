# Pet Health - User Guide
This mobile application, is designed to help pet owner's have the transparency and maintenance ability for their pet's health. Without having to manage multiple app, Pet Health has a solution!, enabling Pet owners to view and monitor certain health areas all in 1 app this includes weight logging, symptom logs, vet visits and a few more. 

**Supported only on Android Mobile Devices**
---

## Technology Stack
| Layer | Technology |
|-------|-----------|
| Frontend |  React Native  |
| Backend | Python Flask |
| Database | MongoDB Atlas (cloud) |
| AI | Gemini Model: gemini-3.5-flash-lite |
| Auth | JWT + Google Authentication |
| Backend Deployment | Render |
| Frontend Deployment | Google Play Store |
| Email confirmation | Brevo API Key (HTTP) |
---

### Step by Step User Guide
Note: The below step by step user guide, has been simplified through all the mobile application features below. 

## Pet Health Features 
### Sign-in/Sign-up 
**Steps to follow:**
Disclaimer: Once the user has opened the app "Pet Health", they will directly be able to view the sign-in/sign-up screen's. 

**Google Auth Sign-in/Sign-up**
1. Sign-up: The user must sign-up with an existing google account by clicking on "Continue with Google" 
2. Sign-in: The user must sign-in via clicking on the text "Sign In" 

**Manual Register/Sign-in**
1. The user must first click on "Get Started" (Button)
2. Enter their details: (Name, Email, Password, Confirm password)
3. The user will then be sent and "Verification code" to their entered email address
4. The user must then enter the code they added inside the "Enter 8-digit code" (from their email address)
5. The user will then be able to see the "Home Screen" 

---

### Home Screen 
1. Inside the "Home Screen", the user will have a variety of options to choose from
2. The user could choose from 2 main options 1. View their existing pets 2. Select from the 4 "Quick Actions" buttons
3. The user will also be able to "Read-only" their pet's added "Vaccines", "Meds" and "Vet Visit" totals
4. When the user clicks onto the "Log Symptom" (Button), this will lead them to the "New Log Symptom Screen"
5. When the user clicks onto the "Weight tracker", this will open the weight log's screen
6. If the user clicks onto the "Vet visits" (Button), this will open the "Vet Visit Logs"
7. If the user clicks onto the "Medications" (Button), this will open the "Medications Log"

---
 
### Pet's Profile 
1. When the user clicks onto their pet log inside "My Pets", they will be able to view their pet's profile details
2. The user will then be able to chose from the 6 main "Quick Access" Buttons which are 1. Log Symptom 2. Weigh-in 3. Vet Visits 4. Medications 5. Predictive Flagging Engine 6. Export PDF
---

### Add New Pet 
1. The User has the option to add an pet image by tapping on the orange circle button with the plus "+" symbol
2. The user would then be able to crop and save their image
3. You will need to full out the form with details that include: 1. Pet Name, 2. Specie, 3. Breed, 4. Age, 5. Weight 6. Gender, 7. Status
4. The user must then tap on "Save Pet" - Button
5. They will then be re-directed to the "My Pet's Screen"
---

### Medications 
1. The user must tap on "Add Medication" from either the (Quick Actions - Home Screen) or (Pet Profile - Quick Actions) Buttons
2. The user must then select their pet by tapping on the "pet name" circular button
3. The user will then have to fill out the form which includes 1. Medication name 2. Purpose 2. Dosage 3. Frequency 4. Set Time 5. Start/End date 6. Instruction/Notes
4. Once the user has filled out the form, they must then tap "Add Medication" Button
Note: the user will then be able to view their newly added medications in the "Active Medications" section 
---

### Vet Visits 
1. The user must tap on "Schedule Visit" from either the (Quick Actions - Home Screen) or (Pet Profile - Quick Actions) Buttons
2. The user must then select their pet by tapping on their pet's [pet-icon & pet-name]
3. The user will then have to fill out the form which include the details (Type of visit, clinic name, veternarian name, Date, Time, additional notes)
4. They must then click on the "Schedule Visit" Button
The user will then be re-directed to the main Vet Visit Log Screen
---

### Quick Symptom Log
1. First, tap on "Log Symptom" from only the main "Home Screen"
2. Select pet by tapping on the button with "pet name's"
3. Tap on the provided "Category" buttons include: Digestive, Skin, Mobility, Appetite
4. Enter in any note's inside the text area under the heading "Describe Symptoms"
5. Tap on one of the buttons "Mild | Moderate | Severe", beneath the heading "Severity"
6. Tap select duration, and select from the provided options ranging from "Today - 2 Weeks"
7. Tap on "Save Entry"
8. Pop-up message will appear, with the 2 options "View Logs" or "Ok" 
9.If you tap on the button, "View Logs" this will be direct you to the main Symptom Logs Screen
10. If you tap on the button, "OK", this will be send you back to the home screen
---

### View My Symptom Logs 
1. Tap on the "Pets", on the main bottom navigation bar
2. Tap on any Pet
3. Tap on Log Symptom, under Quick Access section
4. Main Symptom Log's screen will show 
---

### Weight Tracker 
1. First, you will need to Tap on the "Pet" inside the "My Pet's" Screen
2. Once, you are inside the "My Pet's Screen", you must then tap on any pet 
3. Tap on the button named "Weigh-in"
4. To add a new weight entry you must then tap on "+ Log New Weight Entry"
5. Fill our the required details which include: 1. Weight 2. Past or current date - future dates are not allowed 3. Add Time (optional) 4. Notes
6. Once you have finished filling out the form, tap on "Save Entry"
7. A pop-up message will appear, declaring that your weight-entry has been saved
8. Tap "Ok"
9. You will then be re-directed to the main weight tracker "Dashboard"
Note: View the line chart, change weight from kg/lb
---

### Weight Tracker Dashboard 
1. Tap on any Pet inside the ""
2. 
---

### Predicative Flagging Engine 
**Important Disclaimer: ** The only pet's that are accepted inside our predictive flagging engine based on the pet's weight/age, breed are 
1. Dog Breed: Labrador Retriever
2. Dog Breed: Huntaway
3. Dog Breed: Golden Retriever
4. Cat Breed: British Shorthair
5. Cat Breed: Domestic Shorthair
6. Cat Breed: Ragdoll

1. Tap on either the "Predictive Flagging" button from the Home Screen or from the "Pet's Profile" through the "My Pets" Screen
2. Select Pet from "My Pet's Screen"
3. Under "Quick Actions" Section tap on "Predictive Flagging" button
4. View information in regards to which pet breed's are available to use "Predictive Flagging Engine"
5. Tap on button, "Run New Analysis"
6. View "Predictive Flagging Engine" Screen - that shows pet's age 
 
---
### Export PDF 
1. Tap "Pets" on the bottom navigation bar
2. Tap any pet inside the "My Pet's Screen"
3. Under the Quick Access Section, Tap the button named "Export PDF"
4. Tap on "Export PDF"
5. You should now be able to view the exported pdf, through your chosen mobile app

---

### Timeline Screen 
1. Tap on the button named "Timeline", next to the middle "AI Health Assistant" button
2. Tap on any button which display's the pet owner's "pet name"
3. The user will then be able to view each pet's health activity individually or if the user wishes to view all their pet's health activity this can be done by tapping on "All" 
---

### AI Health Assistant Chat 
1. The user must first tap on the (circle-green) button
2. Select a pet which are displayed by "pet name"
3. Tap suggestions or enter text based question in provided space below
---

## Delete AI Health Assistant Chat
1. To delete chat, tap on "trash-icon-button"
2. View confirmation pop-up message
3. Tap either "Cancel" or "Clear"
4. If tapped "Cancel", the conversation and chat screen will still remain open
5. If tapped "Clear", the user will see a refresh of their screen and a new chat will be opened 
---

