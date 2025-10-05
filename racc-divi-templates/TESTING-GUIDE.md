# RACC Template Testing Guide

## 🧪 **Testing Your Template**

Here are several ways to test the RACC template before deploying it to production:

---

## 🌐 **Option 1: Quick Preview (Instant)**

### **Open the HTML Preview:**
```bash
open template-preview.html
```
Or drag `template-preview.html` into your browser.

**What you'll see:**
- ✅ Visual layout and styling
- ✅ Mobile menu functionality  
- ✅ Responsive design behavior
- ✅ Color scheme and typography
- ❌ WordPress/Divi integration (HTML only)

**Perfect for:** Quick visual checks, mobile testing, design validation

---

## 🐳 **Option 2: Full WordPress Environment (Complete)**

### **Start the Test Environment:**
```bash
cd racc-divi-templates
./start-test-environment.sh
```

### **Setup Process:**
1. **Access:** http://localhost:8080
2. **Install WordPress** (follow setup wizard)
3. **Install Divi Theme:**
   - Download from ElegantThemes
   - Upload via Appearance > Themes
4. **Import Template:**
   - Divi > Divi Library > Import & Export
   - Upload `racc-template.json`
5. **Test on a Page:**
   - Create new page
   - Use Divi Builder
   - Load from Library > "RACC Page Template"

### **Stop Environment:**
```bash
docker-compose down
```

**What you'll test:**
- ✅ Complete WordPress integration
- ✅ Divi Builder compatibility
- ✅ Menu connections
- ✅ Logo uploads
- ✅ Content editing
- ✅ Mobile functionality

**Perfect for:** Full functionality testing, client demos, final validation

---

## 📱 **Option 3: Mobile Testing**

### **Using Browser Dev Tools:**
1. Open `template-preview.html`
2. Press `F12` or `Cmd+Option+I`
3. Click device icon (mobile view)
4. Test different screen sizes:
   - iPhone (375px)
   - iPad (768px)  
   - Desktop (1200px+)

### **Test Checklist:**
- [ ] Mobile menu button appears on small screens
- [ ] Desktop navigation hides on mobile
- [ ] Mobile menu slides out smoothly
- [ ] Touch interactions work
- [ ] Content is readable on all sizes
- [ ] Footer stacks properly on mobile

---

## 🔍 **Option 4: Template Validation**

### **JSON Structure Check:**
```bash
# Validate JSON syntax
python3 -m json.tool racc-template.json > /dev/null && echo "✅ Valid JSON" || echo "❌ Invalid JSON"
```

### **Manual Checks:**
- [ ] Template imports into Divi Library
- [ ] All modules are standard Divi modules
- [ ] CSS is properly escaped in JSON
- [ ] JavaScript is properly escaped in JSON
- [ ] Admin labels are descriptive
- [ ] Image placeholders exist

---

## 📊 **Testing Scenarios**

### **Basic Functionality:**
1. **Template Import** - Imports without errors
2. **Page Creation** - Loads on new page successfully
3. **Menu Connection** - WordPress menus link properly
4. **Logo Upload** - Images replace successfully
5. **Content Editing** - Divi modules work normally

### **Mobile Features:**
1. **Menu Toggle** - Button opens/closes menu
2. **Navigation** - Links work in mobile menu
3. **Responsive** - Layout adapts to screen size
4. **Touch** - All interactions work on touch devices

### **Performance:**
1. **Load Speed** - Page loads quickly
2. **Smooth Animations** - Menu transitions are smooth
3. **No Errors** - Console shows no JavaScript errors
4. **Memory Usage** - No memory leaks from scripts

---

## 🚨 **Common Issues to Test For:**

### **Import Problems:**
- JSON syntax errors
- Missing escape characters
- Corrupted template structure

### **Styling Issues:**
- CSS not applying
- Mobile menu not working
- Responsive breakpoints failing

### **JavaScript Problems:**
- Menu not opening/closing
- Console errors
- Event listeners not working

### **WordPress Integration:**
- Menu connections failing
- Image uploads not working
- Divi Builder conflicts

---

## 📋 **Test Results Checklist**

Mark off each item as you test:

### **Visual Design:**
- [ ] Header layout correct
- [ ] Logo displays properly
- [ ] Navigation styling matches design
- [ ] Footer layout correct
- [ ] Colors match RACC branding
- [ ] Typography is consistent

### **Functionality:**
- [ ] Mobile menu opens/closes
- [ ] Desktop menu works
- [ ] All links are clickable
- [ ] Responsive design works
- [ ] No JavaScript errors

### **WordPress Integration:**
- [ ] Template imports successfully
- [ ] Divi Builder recognizes all modules
- [ ] Menus connect properly
- [ ] Images upload correctly
- [ ] Content is editable

### **Performance:**
- [ ] Fast loading
- [ ] Smooth animations
- [ ] No console errors
- [ ] Works on all browsers

---

## 🎯 **Next Steps After Testing**

1. **Fix any issues** found during testing
2. **Update documentation** if needed
3. **Create backup** of working template
4. **Deploy to staging** environment
5. **Final client review** before production

---

*Complete this testing process before deploying to ensure a smooth client experience!*