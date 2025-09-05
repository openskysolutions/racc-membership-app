import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const MembershipDetailsPage: React.FC = () => {
  const [formData, setFormData] = useState({
    businessName: '',
    primaryEmail: '',
    mainWebsite: '',
    establishedDate: '',
    country: '',
    state: '',
    postalCode: '',
    phone: '',
    categories: [] as string[],
    committees: [] as string[],
    communicationLists: [] as string[],
    additionalItems: [] as { name: string; description: string; price: number; quantity: number }[],
    paymentMethod: 'payNow' as 'payNow' | 'invoiceMe',
    paymentAmount: 0,
    paymentDate: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, options } = e.target;
    const selected = Array.from(options).filter(o => o.selected).map(o => o.value);
    setFormData(prev => ({ ...prev, [name]: selected }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: submit membership details
    console.log('Details submitted:', formData);
  };

  return (
    <div className="py-10 px-4 mx-auto max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Membership Sign-Up</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Business Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="businessName" className="block text-sm font-medium">Business Name</label>
                  <Input id="businessName" name="businessName" value={formData.businessName} onChange={handleChange} />
                </div>
                <div>
                  <label htmlFor="primaryEmail" className="block text-sm font-medium">Primary Email</label>
                  <Input id="primaryEmail" name="primaryEmail" type="email" value={formData.primaryEmail} onChange={handleChange} />
                </div>
                <div>
                  <label htmlFor="mainWebsite" className="block text-sm font-medium">Main Website</label>
                  <Input id="mainWebsite" name="mainWebsite" type="url" value={formData.mainWebsite} onChange={handleChange} />
                </div>
                <div>
                  <label htmlFor="establishedDate" className="block text-sm font-medium">Established Date</label>
                  <Input id="establishedDate" name="establishedDate" type="date" value={formData.establishedDate} onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="country" className="block text-sm font-medium">Country</label>
                  <select id="country" name="country" className="w-full rounded-md border px-3 py-2" value={formData.country} onChange={handleChange}>
                    <option value="">Select a country</option>
                    {/* TODO: populate country list */}
                  </select>
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm font-medium">State/Province</label>
                  <Input id="state" name="state" value={formData.state} onChange={handleChange} />
                </div>
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium">Postal Code</label>
                  <Input id="postalCode" name="postalCode" value={formData.postalCode} onChange={handleChange} />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium">Phone</label>
                  <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* Categories & Committees */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Select Categories</h3>
              <select multiple id="categories" name="categories" className="w-full rounded-md border px-3 py-2" value={formData.categories} onChange={handleMultiSelect}>
                {/* TODO: populate business categories */}
              </select>

              <h3 className="text-lg font-medium">Join Committees</h3>
              <select multiple id="committees" name="committees" className="w-full rounded-md border px-3 py-2" value={formData.committees} onChange={handleMultiSelect}>
                {/* TODO: populate committees */}
              </select>
            </div>

            {/* Communication Lists & Additional Items */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Communication Lists</h3>
              <select multiple id="communicationLists" name="communicationLists" className="w-full rounded-md border px-3 py-2" value={formData.communicationLists} onChange={handleMultiSelect}>
                {/* TODO: populate communication lists */}
              </select>

              <h3 className="text-lg font-medium">Additional Items</h3>
              {/* For simplicity, add logic later to dynamically add items */}
            </div>

            {/* Payment Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Payment Details</h3>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <Input type="radio" name="paymentMethod" value="payNow" checked={formData.paymentMethod === 'payNow'} onChange={handleChange} className="h-4 w-4" />
                  <span>Pay Now</span>
                </label>
                <label className="flex items-center space-x-2">
                  <Input type="radio" name="paymentMethod" value="invoiceMe" checked={formData.paymentMethod === 'invoiceMe'} onChange={handleChange} className="h-4 w-4" />
                  <span>Invoice Me</span>
                </label>
              </div>
              <div>
                <label htmlFor="paymentAmount" className="block text-sm font-medium">Payment Amount</label>
                <Input id="paymentAmount" name="paymentAmount" type="number" value={formData.paymentAmount} onChange={handleChange} />
              </div>
              {formData.paymentMethod === 'payNow' && (
                <div>
                  <label htmlFor="paymentDate" className="block text-sm font-medium">Payment Date</label>
                  <Input id="paymentDate" name="paymentDate" type="date" value={formData.paymentDate} onChange={handleChange} />
                </div>
              )}
            </div>

            <Button type="submit" className="w-full">Continue</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MembershipDetailsPage;