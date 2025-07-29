import UIKit

extension UIView {
    func bindFrameToSuperview(top:CGFloat = 0, leading: CGFloat = 0, trailing:CGFloat = 0, bottom:CGFloat = 0) {
        guard let superview = self.superview else { return }
        self.translatesAutoresizingMaskIntoConstraints = false
        self.topAnchor.constraint(equalTo: superview.topAnchor, constant: top).isActive = true
        self.leadingAnchor.constraint(equalTo: superview.leadingAnchor, constant: leading).isActive = true
        superview.bottomAnchor.constraint(equalTo: self.bottomAnchor, constant: trailing).isActive = true
        superview.trailingAnchor.constraint(equalTo: self.trailingAnchor, constant: bottom).isActive = true
    }
    
    func bindFrameToSuperview(margin:CGFloat) {
        bindFrameToSuperview(top: margin, leading: margin, trailing: margin, bottom: margin)
    }
    
    func frameRelativeToWindow() -> CGRect {
        return convert(bounds, to: nil)
    }
}
