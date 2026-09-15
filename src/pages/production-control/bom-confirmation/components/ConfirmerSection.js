import React from "react";
import { FormSelect } from "@flast-erp/core/components";

const ConfirmerSection = ({
  users = [],
  userLoading = false,
  onUserDropdownOpen,
  onUserPopupScroll,
}) => (
  <section className="section">
    <div className="grid">
      <FormSelect
        required
        name="confirmedBy"
        label="Người xác nhận"
        placeholder="Chọn người xác nhận"
        resourceData={users}
        valueProp="id"
        titleProp="fullName"
        loading={userLoading}
        showSearch
        optionFilterProp="label"
        formatText={(fullName, user) =>
          [fullName, user?.ssoId].filter(Boolean).join(" · ")
        }
        onOpenChange={onUserDropdownOpen}
        onPopupScroll={onUserPopupScroll}
      />
    </div>
  </section>
);

export default ConfirmerSection;
