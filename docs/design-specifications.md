## **4.2 Design Specifications**

### **4.2.1 Brand Style:**

#### **Color Palette:**
A defined set of primary, secondary, and accent colours, including their
HEX or RGB values. These colours should be selected with accessibility in mind, ensuring
sufficient contrast for readability

In terms of accessibility, We should try to not rely solely on red/green differentiation. Patters, icons and text labls can be used to help with differentiation instead.
Orange and seafoam (or teal) are both distict enough from the other colors to be considered the best colors to be used alongside the navy blue primary color.

- Primary colors:
    - #262262 - rgb(38, 34, 98) -> (Navy Blue)
    - #414042 - rgb(65, 64, 66) -> (Grey)
- Secondary colors:
    - #6950a1 - rgb(105, 80, 161) -> (Purple)
    - #1c75bc - rgb(28, 117, 188) -> (Blue)
    - #00a79d - rgb(0, 167, 157) -> (Seafoam)
    - #009444 - rgb(0, 148, 68) -> (Green)
    - #8dc63f - rgb(141, 198, 63) -> (Green Light)
    - #fff200 - rgb(255, 242, 0) -> (Yellow)
    - #f7941d - rgb(247, 148, 29) -> (Orange)
    - #ed1c24 - rgb(237, 28, 36) -> (Red)

#### **Typography:**
Standardised font families, sizes, and weights for headings, body text, and
other UI elements. This ensures readability and a clear visual hierarchy.
- **Font Families:**
  - **apple-system, BlinkMacSystemFont**: This is the apple family of fonts, native on iOS, meaning faster loading and familiarity for iOS users.
  - **Segoe UI and Roboto:** these are our cross-platform fallbacks, font families of Windows and Android respectively. 
  - There are a few different native font families for Linux Distros, so we have some of those covered for extra fallback.
  - **sans-serif:** clean and modern font style, the final fallback still having high legibility for financial data.
- **Sizes, weights:**

| Text | Size | Weight |
|---|:------:|:-------:|
|h1|clamp(2.4rem, 5vw, 4.8rem)|Default|
|eyebrow|12px|700|
|body/lead|1.05rem|Default|


#### **Logo and Inconography:**
Still in progress. will be at least 44x44px for accessibility.

#### **Design Principles:**
- **Dark First:** The interface is designed with for dark environments. Because of the nature of 
- **Glassmorphism:** Key UI surfaces use a blurry, semi-transparent background, providing visual contrast that isn't harsh, and creates depth. This is done using backdrop-filter: blur(12px).
- **Accessibility over aesthetics:** Color choices have guidelines that will help developers create and choose colors that are colorblind-accessible. 
In addition to that, UI statuses and such should be accompanied by intuitive icons instead of solely depending on color.
- **Responsiveness:** Layout uses a check of <= 720px, which is when it collapses the grid into a column.
- **Consistency:** Shared component classes (.card, .button, .badge, .status) ensures a consistent and uniform border-radius, spacing and usage of color accross all views

#### **UI Componenent Styling:**

#### **Accessibility:**

### **4.2.2 Wireframes**

#### **Screen Layouts:**

#### **Navigation Flow:**

#### **Component Placement:**

#### **User Interaction Points:**

#### **Annotations:**