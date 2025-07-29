//
//  ToasterModule.swift
//
//  Created by Innei on 2025/2/21.
//

import ExpoModulesCore

public class ToasterModule: Module {
    struct ToastOptions: Record {
        @Field
        var message: String?
        @Field
        var type: ToastType = .info
        @Field
        var duration: Double = 1.5
        @Field
        var title: String
        @Field
        var position: Position?
    }

    enum ToastType: String, Enumerable {
        case error
        case info
        case warn
        case success

        func toToastType() -> Toast.ToastType {
            switch self {
            case .error:
                return .error
            case .info:
                return .info
            case .warn:
                return .warn
            case .success:
                return .success
            }
        }
    }

    enum Position: String, Enumerable {
        case top
        case center
        case bottom

        func toPostion() -> Toast.Position {
            switch self {
            case .top:
                return .top
            case .center:
                return .center
            case .bottom:
                return .bottom
            }
        }
    }

    public func definition() -> ModuleDefinition {
        Name("Toaster")

        Function("toast") { (value: ToastOptions) in
            Toast.show(options: Toast.ToastOptions(message: value.message, type: value.type.toToastType(), duration: value.duration, title: value.title, position: value.position?.toPostion() ?? .top))
        }
    }
}
