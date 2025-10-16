import { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Privacy: FC = () => (
  <div className="container py-20 max-w-4xl mx-auto text-sm">
    <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
    
    <div className="prose prose-lg max-w-none">
      <p className="text-sm text-gray-600 mb-8">
        <strong>Effective Date:</strong> October 1, 2025
      </p>

      <p className="mb-6">
        The Richfield Area Chamber of Commerce knows that your privacy is important to you, and we want you to know that it is 
        important to us too. We created this Policy to explain the types of information we collect through our websites on which 
        it is posted (including mobile-optimized versions of our websites) and the various social networking platforms that we 
        use (each, a "Site"), how we will use, disclose, and protect this information once it is collected, and how you can opt 
        out of some of our uses and disclosures of your information.
      </p>

      <h2 className="text-2xl font-semibold mt-0 mb-4">General Principles</h2>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>
          The Site is owned and operated by the Richfield Area Chamber of Commerce and its affiliated organizations (referred 
          to collectively in this policy as "the Richfield Area Chamber," as well as "we," "us," "our," and other similar pronouns).
        </li>
        <li>
          <strong>CALIFORNIA'S "SHINE THE LIGHT" LAW, CIVIL CODE SECTION 1798.83</strong>, requires certain businesses to respond to 
          requests from California customers asking about the businesses' practices related to disclosing personal information to 
          third parties for the third parties' direct marketing purposes. You may request information regarding our sharing of 
          personal information with third parties for the third parties' direct marketing purposes by contacting us in writing at: 
          Customer Service, Richfield Area Chamber of Commerce, Richfield, UT, USA, or by sending an e-mail to{' '}
          <a href="mailto:privacy@richfieldareachamber.com" className="text-blue-600 underline">
            privacy@richfieldareachamber.com
          </a>.
        </li>
        <li>
          This Privacy Policy does not apply to any website or areas of any websites that are directed to kids under 13.
        </li>
        <li>
          As our business evolves, this Policy may change, so check back to this page periodically to make sure you understand 
          how your Personal Information will be treated.
        </li>
        <li>
          This Policy does not apply to information that you may provide to us, or that we may obtain, other than through our 
          Site, such as over the phone, by mail, or in person.
        </li>
        <li>
          <strong>IF YOU ARE LOCATED OUTSIDE OF THE UNITED STATES</strong>, you should know that the information you provide to us 
          is being transmitted to us and processed in the United States and will be protected subject to this Privacy Policy and 
          United States laws, which may not be as protective as the laws in your country. Also, this Site places cookies and local 
          shared objects on your computer or device which are further described below. By using the Site, you agree to this.
        </li>
        <li>
          Advertisements displayed to you online may be customized to your interests and preferences based on your personally 
          identifiable information and website usage information collected through our Site and other online properties unless you 
          opt out by following the instructions that can be found{' '}
          <a href="http://www.networkadvertising.org/choices" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
            here (Network Advertising Initiative)
          </a>{' '}
          and{' '}
          <a href="http://www.aboutads.info/choices" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
            here (AboutAds)
          </a>. (You have to opt out using each of your web browsing applications separately.) However, if you opt out we may still 
          suggest offerings to you on our Site based on your history at our Site.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold mt-0 mb-4">Opt-In and Opt-Out</h2>
      <p className="mb-4">
        You may have the right to opt in to or opt out of certain of our uses and disclosures of your Personal Information. For 
        example, when you are asked to provide Personal Information on this Site, you may have the opportunity to elect to, or not 
        to, receive messages from us by e-mail. You may tell us that you do not want to receive our promotional messages or that 
        you do not want to have your Personal Information shared with unaffiliated third parties by sending us your name, address, 
        e-mail, and phone number to: Customer Service, Richfield Area Chamber of Commerce, Richfield, UT, USA;{' '}
        <a href="mailto:privacy@richfieldareachamber.com" className="text-blue-600 underline">
          privacy@richfieldareachamber.com
        </a>.
      </p>
      <p className="mb-6">
        You can also opt out of our promotional e-mails by clicking on the opt-out link within the e-mail you receive. Please 
        understand that it may take us a few days to process any opt-out request and that even if you opt out of receiving 
        promotional correspondence from us, we may still contact you in connection with your relationship, activities, transactions, 
        and communications with us. Also, to stop receiving promotional messages from third parties who already have your contact 
        information, please contact them directly.
      </p>

      <h2 className="text-2xl font-semibold mt-0 mb-4">What Information is Collected on this Site?</h2>
      
      <h3 className="text-xl font-semibold mt-6 mb-3">User-Provided Information</h3>
      <p className="mb-4">
        "Personal Information" is information that can be used to identify you as an individual or allow someone to contact you, 
        as well as information attributed with such information. We collect Personal Information such as your name; company name; 
        postal addresses; e-mail addresses; telephone numbers; fax numbers; photograph; gender; credit card and other payment 
        information; purchase, site browsing, and transaction history; job history and application information; and interests, 
        hobbies, and demographic information.
      </p>
      <p className="mb-4">
        For example, we collect Personal Information when you conduct a transaction on our Site; create an account on our Site; 
        sign up for our newsletters; register for events; donate through our Site; submit forms for grassroots action; make online 
        purchases; enter sweepstakes and contests; complete surveys; contribute to a chat room, bulletin board, listserv, blog, 
        wiki, or other social forum on the Site; or submit a comment or question to us using a "contact us" or similar feature on 
        the Site.
      </p>
      <p className="mb-6">
        A "tell-a-friend" or online greeting card tool provided on the Site and/or in our e-mails allows you to send information 
        about our articles, products, and offerings to another person. When you use these offerings, we may ask you for the name 
        and information of the other person, and that information will be protected pursuant to this privacy policy.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Site Usage Information</h3>
      <p className="mb-4">
        As is the case with many websites, our servers automatically collect your IP address when you visit our Site, and we may 
        associate that with your domain name or that of your Internet access provider. If you visit a mobile-optimized version of 
        the Site, we may receive data from or about the mobile phone or devices that you use to access the Site, including type of 
        device and mobile carrier.
      </p>
      <p className="mb-4">
        We may also capture certain "clickstream data" pertaining to your Site usage. Clickstream data includes, for example, 
        information about your computer or device, web browser and operating system and their settings, the referring page that 
        linked you to the Site, the pages, content or ads you see or click on during your visit and when and for how long you do 
        so, items you download, the next website you visit when you leave the Site, and any search terms you have entered on the 
        Site or a referral site.
      </p>
      <p className="mb-4">
        Among other things, this information enables us to generate analytics reports on the usage of our Site. To opt out of your 
        Site usage being included in our Google Analytics reports, you may follow{' '}
        <a href="https://tools.google.com/dlpage/gaoptout" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
          Google's instructions
        </a>.
      </p>
      
      <p className="mb-4">In addition, we may deploy various tracking technologies on the Site to collect additional information about your Site visits. For example:</p>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>
          <strong>Cookies</strong> are small data files stored on your computer or device at the request of a website. A cookie 
          assigns a unique numerical identifier to your web browser, and may enable us to recognize you as the same user who was at 
          our Site in the past, and relate your use of the Site to other information about you, such as your Site Usage Information 
          and Personal Information. Most browsers can be set to detect cookies and give you an opportunity to reject them, but 
          refusing cookies may, in some cases, inhibit or preclude your use of the Site or its features.
        </li>
        <li>
          <strong>HTML5 local storage</strong> may be used to store information on your computer or device about your Site usage 
          activities. This information can be retrieved by us to determine how our Site is being used by our visitors, how it can 
          be improved, and to customize it for our users.
        </li>
        <li>
          <strong>Pixel tags</strong> (also known as "clear GIFs" or "web beacons") are tiny images—typically just one pixel—that 
          can be placed on a web page or in our electronic communications to you in order to help us measure the effectiveness of 
          our content by, for example, counting the number of individuals who visit us online or verifying whether you've opened 
          one of our e-mails or seen one of our web pages.
        </li>
      </ul>
      <p className="mb-6">
        By using our Site, you consent to our use of these tracking technologies as described above.
      </p>

      <h2 className="text-2xl font-semibold mt-0 mb-4">Do-Not-Track Disclosures</h2>
      <p className="mb-4">
        Some web browsers may transmit "do-not-track" (DNT) signals to the websites with which the user communicates. Because of 
        differences in how web browsers incorporate and activate this feature, it is not always clear whether users intend for 
        these signals to be transmitted, or whether they even are aware of them. Because there currently is no industry standard 
        concerning what, if anything, websites should do when they receive such signals, we currently do not change our tracking 
        practices in response to DNT settings in your web browser.
      </p>
      <p className="mb-6">
        Our third-party partners, such as ad networks, web analytics companies, and social media and networking platforms, collect 
        information about your online activities over time and across our Site and other online properties. These third parties do 
        not change their tracking practices in response to DNT settings in your web browser and we do not obligate these parties 
        to honor DNT settings. We utilize Google Analytics for our web analytics and you can opt out from your data being used by 
        Google Analytics by visiting{' '}
        <a href="https://tools.google.com/dlpage/gaoptout" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
          https://tools.google.com/dlpage/gaoptout
        </a>.
      </p>

      <h2 className="text-2xl font-semibold mt-0 mb-4">How is Your Information Used?</h2>
      <p className="mb-4">We or our service providers may use the information we collect from and about you to perform the following business functions:</p>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>enabling users to use our Site and its features</li>
        <li>processing and fulfilling your transactions</li>
        <li>administering the Site and your account with us</li>
        <li>responding to your requests, questions, and concerns</li>
        <li>market research</li>
        <li>developing new features and offerings on the Site</li>
        <li>sending you marketing and other communications, including information about products, services, and events, of ours and of others, that we think might interest you</li>
        <li>protecting our rights and property</li>
        <li>recovering debt and preventing fraud</li>
        <li>customizing our Site to your interests and history with us</li>
        <li>tailoring ads displayed to you on our Site and elsewhere to your interests and history with us</li>
        <li>other purposes disclosed when personal information is submitted to us</li>
        <li>otherwise for research and development, analytics, and to improve, enhance, and develop new products, services, and other offerings</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-0 mb-4">Social Networking</h2>
      <p className="mb-6">
        We maintain presence on several social networking and blogging platforms, such as Facebook and X (Twitter). We also 
        incorporate some third-party social networking features onto our Site that allow you to share and/or publicly post content 
        or information from our Site to your profile on a third-party social network. Through these platforms and features, we 
        receive some Personal Information and some Site Usage Information about you, and this Privacy Policy applies to that 
        information as well.
      </p>

      <h2 className="text-2xl font-semibold mt-0 mb-4">Do We Share Personal Information and Site Usage Information with Others?</h2>
      <p className="mb-4">
        Yes. We may share the information we collect on the Site with others for a variety of reasons. In addition to the kinds of 
        information sharing you might expect, such as sharing with third parties who need your information in order to provide 
        services to us (or on our behalf) and sharing what you voluntarily post to public areas on the Site with other Site users, 
        we may share your information:
      </p>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>with our affiliates</li>
        <li>with other third parties for their marketing and other purposes, unless you ask us not to by following the instructions in the Opt-In and Opt-Out section above</li>
        <li>with our co-sponsor(s) if we obtain your information in connection with a contest, sweepstakes, offering, or other promotional activity that is jointly offered by us and any third parties</li>
        <li>when we believe in good faith that disclosure is necessary to protect our rights or property, protect your safety or the safety of others, investigate fraud or respond to a government, judicial or other legal request, or to comply with the law</li>
        <li>in connection with a corporate change or dissolution, including for example a merger, acquisition, reorganization, consolidation, bankruptcy, liquidation, sale of assets, or wind down of business</li>
      </ul>
      <p className="mb-6">
        In addition, we may share non-personally identifiable Site Usage Information (including aggregate data) with others, for 
        their own use, in a form that does not include your name or contact information.
      </p>

      <h2 className="text-2xl font-semibold mt-0 mb-4">Your Access Rights</h2>
      <p className="mb-6">
        You may review, update, or modify certain of the Personal Information that is stored in our records by contacting us by 
        e-mail at{' '}
        <a href="mailto:privacy@richfieldareachamber.com" className="text-blue-600 underline">
          privacy@richfieldareachamber.com
        </a>. We may ask you to verify your identity and to provide other details before we are able to provide you with any 
        information, correct any inaccuracies, or delete any information. Your right to delete your information is subject to our 
        records retention policies.
      </p>

      <h2 className="text-2xl font-semibold mt-0 mb-4">Security</h2>
      <p className="mb-4">
        While we endeavor to protect the security and integrity of sensitive Personal Information collected via this Site, due to 
        the inherent nature of the Internet as an open global communications vehicle, we cannot guarantee that any information, 
        during transmission through the Internet or while stored on our system or otherwise in our care, will be absolutely safe 
        from intrusion by others, such as hackers.
      </p>
      <p className="mb-4">
        If you correspond with us by e-mail or using web forms like a "contact us" feature on our Site, you should be aware that 
        your transmission might not be secure. A third party could view the information you send in transit by such means. We will 
        have no liability for disclosure of your information due to errors or unauthorized acts of third parties during or after 
        transmission.
      </p>
      <p className="mb-6">
        If you create an account on our Site, you are responsible for maintaining the strict confidentiality of your account 
        password, and you shall be responsible for any activity that occurs using your account credentials, whether or not you 
        authorized such activity. Please notify us of any unauthorized use of your password or account or any other breach of 
        security.
      </p>

      <h2 className="text-2xl font-semibold mt-0 mb-4">"Linked-To" Websites</h2>
      <p className="mb-6">
        The Site may contain links, banners, widgets, or advertisements that lead to other websites. We are not responsible for 
        these other sites, and so their posted privacy policies (not this Policy) will govern the collection and use of your 
        information on them. We encourage you to read the privacy statements of each website visited after leaving the Site to 
        learn about how your information is treated by others.
      </p>

      <h2 className="text-2xl font-semibold mt-0 mb-4">Changes to this Privacy Policy</h2>
      <p className="mb-6">
        We may change this Policy from time to time. When we do, we will let you know by posting the changed Policy on this page 
        with a new "Effective Date." In some cases (for example, if we significantly expand our use or sharing of your Personal 
        Information), we may also tell you about changes by additional means, such as by sending an e-mail to the e-mail address 
        we have on file for you. In some cases, we may request your consent to the changes.
      </p>

      <h2 className="text-2xl font-semibold mt-0 mb-4">Contact Us</h2>
      <p className="mb-4">If you have any questions or comments regarding our privacy practices, you may contact us at:</p>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Customer Service</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>Richfield Area Chamber of Commerce</p>
            <p>Richfield, UT, U.S.A.</p>
            <p>
              <a href="mailto:privacy@richfieldareachamber.com" className="text-blue-600 underline hover:text-blue-800">
                privacy@richfieldareachamber.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default Privacy;
